export const orgTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            background-color: #050c09;
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 2rem 6rem;
            object-fit: cover;
        }   
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .logo {
            width: 250px;
            margin-bottom: 20px;
        }
        h1 {
            color: #d7bd21;
        }
        p {
            color: #9FB9B2;
            font-size: 16px;
        }
        strong {
            color: #d7bd21;
        }
        .button-container {
            margin-top: 30px;
        }
        .btn {
            display: inline-block;
            font-size: 16px;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 10px;
            background-color: #d7bd21;
            color: white;
            border: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/app_assets/Small%20Icon.png" alt="rafik-logo" class="logo">
        <h1>Welcome to Rafik!</h1>
        <p>Ready to take control of your fitness journey with the right trainer by your side?</p>
        <p>Join <strong>Rafik</strong> today and connect with certified professionals who are here to guide and hold you accountable.</p>
        <div class="button-container">
            <a href="https://www.rafikapp.ae/register" class="btn">Sign Up Now</a>
        </div>
    </div>
</body>
</html>
`;
