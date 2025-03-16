export const template = (
  userName: string,
  trainerName: string,
  programName: string
) => `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            background-color: #081411;
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 2rem 6rem;
        
        }   
        .container {
            background-color: #081411;
            width: 100%;
        }
        .inner {
            max-width: 600px;
            margin: 0 auto;
        }
        .logo {
            width: 250px;
            margin-bottom: 20px;
        }
        h1{
            color: #d7bd21;
        }
        p {
            color: #9FB9B2;
            font-size: 16px;
        }
        .button-container {
            padding-top: 22px;
            padding-bottom: 60px;
        }
        strong{
            color:#d7bd21
        }
        .btn {
            display: inline-block;
            font-size: 16px;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 5px;
            margin: 10px;
        }
        .btn-filled {
            background-color: #d7bd21;
            color: white !important;
            border: none;
        }
        .btn-outline {
            border: 2px solid #d7bd21;
            color: #d7bd21 !important;
            background: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="inner">
            <img src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/app_assets/Small%20Icon.png" alt="rafik-logo" class="logo">
            <h1>Hey ${userName}</h1>
            <div>
                <p><strong>${trainerName}</strong> is inviting you to join their <strong>${programName}</strong> training program! This is your chance to take your fitness journey to the next level.</p>
                <p>To activate your membership, simply open the app, go to your <strong>user settings</strong>, tap on <strong>Program Invites</strong>, and then select <strong>Accept Invitation</strong>.</p>
                <p>Get started today by accessing our app on your preferred platform:</p>
                <div class="button-container">
                    <a href="your-appstore-link" class="btn btn-filled">Download on App Store</a>
                    <a href="https://play.google.com/store/apps/details?id=com.samtech.rafiksquire" target="_blank" class="btn btn-outline">Get it on Google Play</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
