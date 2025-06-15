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

export const feedbackTemplate = (
  userName: string,
  programName: string,
  difficulty: number, // from 1 to 5
  pump: number, // from 1 to 5
  exhaustion: number, // from 1 to 5
  enjoyment: number, // from 1 to 5
  additionalNotes: string
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
          h1 {
              color: #d7bd21;
          }
          p {
              color: #9FB9B2;
              font-size: 16px;
          }
          .score-row {
              margin: 10px 0;
          }
          .label {
              color: #d7bd21;
              font-weight: bold;
          }
          .dots {
              margin-top: 5px;
          }
          .dot {
              display: inline-block;
              height: 14px;
              width: 14px;
              margin: 0 2px;
              border-radius: 50%;
              background-color: #3f4a47;
          }
          .dot.filled {
              background-color: #d7bd21;
          }
          .notes {
              background-color: #11211e;
              color: #9FB9B2;
              padding: 15px;
              border-radius: 5px;
              font-size: 14px;
              margin-top: 20px;
              text-align: left;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="inner">
              <img src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/app_assets/Small%20Icon.png" alt="rafik-logo" class="logo">
              <h1>Workout Feedback from ${userName}</h1>
              <p>This is the workout feedback for the <strong>${programName}</strong> program you assigned.</p>
              <div class="score-row">
                  <div class="label">Difficulty:</div>
                  <div class="dots">
                      ${[...Array(5)]
                        .map(
                          (_, i) =>
                            `<span class="dot ${
                              i < difficulty ? "filled" : ""
                            }"></span>`
                        )
                        .join("")}
                  </div>
              </div>
              <div class="score-row">
                  <div class="label">Pump:</div>
                  <div class="dots">
                      ${[...Array(5)]
                        .map(
                          (_, i) =>
                            `<span class="dot ${
                              i < pump ? "filled" : ""
                            }"></span>`
                        )
                        .join("")}
                  </div>
              </div>
              <div class="score-row">
                  <div class="label">Exhaustion:</div>
                  <div class="dots">
                      ${[...Array(5)]
                        .map(
                          (_, i) =>
                            `<span class="dot ${
                              i < exhaustion ? "filled" : ""
                            }"></span>`
                        )
                        .join("")}
                  </div>
              </div>
              <div class="score-row">
                  <div class="label">Enjoyment:</div>
                  <div class="dots">
                      ${[...Array(5)]
                        .map(
                          (_, i) =>
                            `<span class="dot ${
                              i < enjoyment ? "filled" : ""
                            }"></span>`
                        )
                        .join("")}
                  </div>
              </div>
              ${
                additionalNotes
                  ? `<div class="notes"><strong>Additional Notes:</strong><br>${additionalNotes.replace(
                      /\n/g,
                      "<br>"
                    )}</div>`
                  : ""
              }
          </div>
      </div>
  </body>
  </html>
  `;
