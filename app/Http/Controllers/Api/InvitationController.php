<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InvitationMail;
use App\Models\Employee;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;

class InvitationController extends Controller
{
    /**
     * List all invitations for the authenticated user's organization.
     */
    public function index(Request $request)
    {
        $invitations = Invitation::where('organization_id', $request->user()->organization_id)
            ->with('invitedBy:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($invitations);
    }

    /**
     * Send an invitation to an employee email.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = $request->user();

        // Check if email is already a user in this organization
        $existingUser = User::where('email', $validated['email'])
            ->where('organization_id', $user->organization_id)
            ->first();

        if ($existingUser) {
            return response()->json([
                'message' => 'This email is already registered in your organization.',
            ], 422);
        }

        // Check if there's already a pending invitation
        $existingInvitation = Invitation::where('email', $validated['email'])
            ->where('organization_id', $user->organization_id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'message' => 'A pending invitation already exists for this email.',
            ], 422);
        }

        $invitation = Invitation::create([
            'organization_id' => $user->organization_id,
            'invited_by' => $user->id,
            'email' => $validated['email'],
        ]);

        $invitation->load('organization');

        Mail::to($validated['email'])->send(new InvitationMail($invitation));

        return response()->json([
            'message' => 'Invitation sent successfully.',
            'invitation' => $invitation->load('invitedBy:id,name'),
        ], 201);
    }

    /**
     * Revoke a pending invitation.
     */
    public function destroy(Request $request, Invitation $invitation)
    {
        // Ensure the invitation belongs to the user's organization
        if ($invitation->organization_id !== $request->user()->organization_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => 'Only pending invitations can be revoked.'], 422);
        }

        $invitation->delete();

        return response()->json(null, 204);
    }

    /**
     * Verify an invitation token (public route).
     */
    public function verify(string $token)
    {
        $invitation = Invitation::where('token', $token)
            ->with('organization:id,name')
            ->first();

        if (!$invitation) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid invitation link.',
            ], 404);
        }

        if ($invitation->status === 'accepted') {
            return response()->json([
                'valid' => false,
                'message' => 'This invitation has already been accepted.',
            ], 410);
        }

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);
            return response()->json([
                'valid' => false,
                'message' => 'This invitation has expired.',
            ], 410);
        }

        return response()->json([
            'valid' => true,
            'email' => $invitation->email,
            'organization_name' => $invitation->organization->name,
        ]);
    }

    /**
     * Accept an invitation and create the employee's user account.
     */
    public function accept(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $invitation = Invitation::where('token', $validated['token'])
            ->where('status', 'pending')
            ->first();

        if (!$invitation || $invitation->isExpired()) {
            return response()->json([
                'message' => 'Invalid or expired invitation.',
            ], 422);
        }

        // Create the user account
        $user = User::create([
            'name' => $validated['name'],
            'email' => $invitation->email,
            'password' => $validated['password'],
            'organization_id' => $invitation->organization_id,
            'role' => 'employee',
        ]);

        // Create or link an employee record
        $employee = Employee::where('email', $invitation->email)
            ->where('organization_id', $invitation->organization_id)
            ->first();

        if ($employee) {
            // Link existing employee record to this user
            $employee->update(['user_id' => $user->id]);
        } else {
            // Create a new employee record
            Employee::create([
                'user_id' => $user->id,
                'organization_id' => $invitation->organization_id,
                'name' => $validated['name'],
                'email' => $invitation->email,
                'role' => 'Team Member',
                'department' => 'Unassigned',
            ]);
        }

        // Mark invitation as accepted
        $invitation->update(['status' => 'accepted']);

        // Auto-login the new user
        Auth::login($user);

        return response()->json([
            'user' => $user->load('organization'),
            'message' => 'Welcome! Your account has been created.',
        ], 201);
    }
}
