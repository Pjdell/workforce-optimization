<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f5f1;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: #243630;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 20px;
            margin: 0;
            font-weight: 600;
        }
        .body {
            padding: 40px;
        }
        .body p {
            color: #405747;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 16px;
        }
        .btn {
            display: inline-block;
            background: #c85f31;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            margin: 16px 0 24px;
        }
        .btn:hover {
            background: #b5522a;
        }
        .note {
            color: #6e826a;
            font-size: 13px;
            border-top: 1px solid #e8ebe6;
            padding-top: 20px;
            margin-top: 24px;
        }
        .footer {
            background: #f8faf7;
            padding: 20px 40px;
            text-align: center;
        }
        .footer p {
            color: #8a9d86;
            font-size: 12px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Workforce Optimizer</h1>
        </div>
        <div class="body">
            <p>Hello,</p>
            <p>
                You've been invited to join <strong>{{ $organizationName }}</strong> on Workforce Optimizer.
                Click the button below to create your account and start managing your skills, availability, and preferences.
            </p>
            <div style="text-align: center;">
                <a href="{{ $acceptUrl }}" class="btn">Accept Invitation</a>
            </div>
            <p class="note">
                This invitation will expire on <strong>{{ $expiresAt }}</strong>.
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Workforce Optimizer. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
