const logger = require("../../utils/logger");
const { PrismaClient } = require("@prisma/client");
const { Role } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");

async function createNotification(recepientId, message) {
    try {
        const notification = {
            recepientId,
            message,
            createdAt: new Date(),
            isRead: false,
        };

        const newNotification = await prisma.notification.create({
            data: notification,
        });
        return newNotification;
    } catch (error) {
        logger.error("Error creating notification", error);
        throw new Error("Error creating notification");
    }
}

async function sendNotificationToAdmins(message, interventionData = {}) {
    try {
        // Get all admins with correct case for role
        const admins = await prisma.userAccount.findMany({
            where: {
                role: Role.ADMIN,
                isBlocked: false,
            },
        });

        if (admins.length === 0) {
            logger.warn("No admin users found to notify");
            return { success: false, message: "No admin users found" };
        }

        // Create notifications in the database
        const notificationsData = admins.map((admin) => ({
            userId: admin.id,
            message,
            createdAt: new Date(),
            read: false,
        }));

        await prisma.notification.createMany({
            data: notificationsData,
        });

        // Check if email credentials are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            logger.warn("Email credentials not configured");
            return {
                success: true,
                message:
                    "Notifications saved but emails not sent due to missing configuration",
            };
        }

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Get admin emails
        const adminEmails = admins.map((admin) => admin.email);

        // Create HTML email with replaced placeholders
        const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nouvel problème signalé</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
    td {font-family: Arial, sans-serif;}
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, p {
      margin: 0;
      padding: 0;
    }
    
    /* Base styles */
    body {
      font-family: Arial, sans-serif;
      background-color: #fdfafaad;
      color: #000;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    /* For Outlook */
    table {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    /* Image handling */
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      display: block;
      height: auto;
      outline: none;
      text-decoration: none;
    }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      
      .email-content {
        padding: 20px !important;
      }
      
      .footer-content {
        padding-left: 20px !important;
      }
      
      .deco-image {
        width: 120px !important;
      }
      
      .logo-image {
        width: 80px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fdfafaad; color: #000; width: 100%;">
  <!-- Email container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Main content wrapper -->
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="background-color: #edededc4;">
          
          <!-- Top-left decoration -->
          <tr>
            <td align="left" style="padding: 0;">
              <img class="deco-image" src="https://ci3.googleusercontent.com/meips/ADKq_Nanu-Mi6j_nU1L9b3tJtxdCjgLGYAzcI-OFHqQF9SwW0KPGTRXTbrYZnggRxAiKzalhtTPciOls-_PEjPcjMKbJ04sCvTfHxNSi6muwexFAOlObMt8ri0_Xlkb8pICXfW0OwoEqmM_7r3UFtK6yEdYljctArcgZAm3u8U2P-PNpInOE1FrX3lEwsydoUC0r-klEr1kMRonXQ-Y_RE7h4rnkU3q7AwelFlIol4o7O25V2K0mMCha5NJh-PhGLWQCwChelolTVFUC7Y7ZFtDONvMwEoEe_Q7iHODsZUlizYB3wtrxyaVcgnuxCdEWbFbOdOGGJqU3nuQ5MvDuiwtaLXs12McaxpahSmkPVR17fsUV0Qcfin01fRgQQCkugaghbTP8Cj8pgo3TGgd6sDVWoERfUfLaL42O3UOC9ovvXl0kgvO97ioFWajoz4yze-_9EcVtiMC6nO-BtuFaii6INj6jo3nXlNtSObv4tAkkIVTj-FSid3o2aiMoegCewg0N6jCOCiZalPrK7GRrrb8PnZbjHeiRA22lAiRvm6XpANw6nPwhp8BFkV2SGYnbx-5UwnXi764ACJTC2ZWOsoDjh2OGvkblJVvW-3z9TIE08GyWP43OH6m6PZP_fQqVxBe4xhKiAwQ=s0-d-e1-ft#https://media-hosting.imagekit.io/61d2ca6f4b8b48ad/deco2.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=2AhShgwz24eZvGl8l-FWEJLApjcPpCpDyPJ4Db-UWQGB1-f0Xn03v1~mKH99cd4o8RWa7b4qLMrgQ7wevbWI6PU8eBk-sZ4RQXJX3fk67ik0qeI9mrJVD2fAd5wnBxTnjT5GYhhOjU--BZqvJimR51Di-x5KJ75SQ2ZWQY~thRRH2J-IrEgPWkAAzV34ULycYTQqnDehK618-nLuzLOTWrNxVh5UkVMbVbJZZjCyg1aE2NXMnWwfy20vCCrnNKCFEafRFshd4VMUKi74awV4L-V4A85FoItmpHQJzqqK1UrvuM~THL5ZEgSJFIABP~0TcALP1WqdxSbpTKWVFCerOA__" alt="" width="150" style="display: block; max-width: 100%;" />
              
            </td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="margin-bottom: -30px;">
              <img class="logo-image" src="https://ci3.googleusercontent.com/meips/ADKq_NYCDaLgbi4DHESKDmyP9-ByrfyqYdJXkzY9ce36irEXclGPpLc2ltqADMam8pQO_Yz-YK0-fuB7hgmiTzI0lDrSnPE37XT2PXPvjM125qqQ4zJpOVH-Q2wV7v_Ogn4HHMOB5JPpf66HiNB3SInIjKeRdUOhDhhyRr0ZjBoSc2ZMzg13YajCef_qzmWYwIqNgTax6rS_ilf4ZToIH17DcGEkzR_s9Ehv33IDmkzdRmrCRLF8Iu-o3ab-J3RAjFiH-LH7HGxfG6HrEGD3uLvzfmO6ZMo9CXDcMhTN5byZA2FAwb-f4kyRA53cS02jMcnfdY2I-CTpUd7jydpN9M_4W2BZmwYVa4QlpsT16tCtkf72b0bUegW14a2gAojjlqCL4et29_hzOgyO7BcSlYoVL9nICvR13d51UCVsa5HbVqmFZoufIrKJgYpePrhwwSKr7HftdIT88ZwXiRUnnoxJvH0TxxoiJBNNP6KduvWcL0YPDhewXHpDWxKn6K-Qd2o7BExaaCEu3zF5c8oAVdKzNhjVHifxjpNyOVUBOtGIoKGrlZWjAGSOoKd7XiPG_cUC5nGPtPZgA42fjwheD0axv2wuIMVtlyI9sAtODrN0LBZSTb8_ZdmsD8VcFqOlmKm4YN6ZQ6lkXZK7=s0-d-e1-ft#https://media-hosting.imagekit.io/4e44c6cf98794fc4/LOGOBLACK.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=TGBwoDUk6rVjCfn0ppb92DPdgE1P22M04~BmWk6pkXxPRQOVhohVFNRmSOK36aStaebca12lrahXWfZq2HXEeeksOm5Yd86Hyi1j7S2DIk9NHYuwrJgroDoTFqxoDt3DNB~Q8T~oBMxlLchflZBSes7wM0IyLhFVJHgHmxOtlrF~XHBWVSXJ2KaZt0oiTeX5Vx7emucjWHmObsD1qY1XBLG2Eyk0BGQ27yuEu6shbrep4X-XqPV24TaRcM3konx7hO9TxfLLz6eg0HrPneJrqOsav2n-ecENahzA8ckQlmWqTlOTK9kZA28A~VLKcc34rObJzdQVmKS9HDzOn-GlEA__" alt="ESI LOGIS" width="100" style="display: block; max-width: 100%;" />
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td class="email-content" style="padding: 30px 40px 40px 40px;">
              <p style="margin-top: 0; margin-bottom: 16px;">Bonjour,</p>
              <p style="margin-top: 0; margin-bottom: 16px;">
                Un <a style="color: #007bff; text-decoration: none;">nouvel problème</a> a été signalé.
                Merci de le consulter dès que possible.
              </p>
              <p style="margin-top: 0; margin-bottom: 16px;">
                Localisation : ${
                    interventionData.location || "Non spécifiée"
                }<br>
                Description : ${interventionData.description || message}
              </p>
              <p style="margin-top: 0; margin-bottom: 0;">
                Cordialement,<br>ESI LOGIS
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-content" style="padding-left: 40px; font-size: 14px;">
              <p style="margin-top: 0; margin-bottom: 16px;">
                📞 Téléphone : +213 123456789<br>
                🌐 Site web : <a href="http://www.esilogis.dz" style="color: #007bff; text-decoration: none;">www.esilogis.dz</a>
              </p>
            </td>
          </tr>

          <!-- Bottom-right decoration -->
          <tr>
            <td align="right" style="padding: 0;">
              <img class="deco-image" src="https://ci3.googleusercontent.com/meips/ADKq_Naim5s4v6dlppkPtsT69TidI-o_NMGC_Tr_T1YJhnqGTQls0LXgv_iITkvkLKuQyYCi6xnle4FkOf_bndQ7_bGgmfLAdo1RFn4b8AlU1yFO3CWwk7EkBMzOUVZn67rvZF1LlZ2px3n2HqtJgALgsW04cqgwQfYiIIeayaixNZ8VkfETXDN6o_7zHWsO1_ranxlTsywPHMCTK3vhzrYJISrFjZhGj4nkBKmNhbJICXb4mtmPtz1iTiYe_Y7Np-0A7W081HtaFn2aUuFYz0nrABA3Rt9bw0pCtQm9dLzUS_zIOUS6xus4r4l2EqH2wNkwjZFepIESBbERIDRmI4PeH_sskIskanAYlBgb46YR0oMrWBtlr8LCWwgZPMewrDn6HPRGBvwcit_sLwwK4U01NlwW3q3tIQG09Fm-uqf53AYr9WU0rPhUEBH1e-3Gpl1bLjALhHel2qBDZ7bssWho7_gpYScy7hGm9sKen0_zktyOGcgOQurMrw2D9uv9n4PDcbVC_l-zOZpdhubn6zC6Cz07sEev_weQYn1ewlQ_HCgSOxk9LGjnJYYydTVo0Lmr-X9PZlbpM1SWYVYHfBAHxxukfCVLxutDr58HtaCsjmPHz4AtmwggNwuZ7tnwcHpnlt58nB8=s0-d-e1-ft#https://media-hosting.imagekit.io/c9e35a8c7853427d/deco3.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=DCr6EjPg0TMdfptT2JlV63baJD3Aj64QfBXxJMwzH~UB3Llh3gobBUuWeU1bcNSzRTCINOJRA5OOH~IiS7JMSw3WLFhWxqeaF5CuetfC0Pef7lX--XZItT7KfBa9~uSH7sIWYgxIEcaZQlyxD0pOg2e1CYOetbFCRvO573aknIPkyoq8ZhIaadeujiDmj72eGZae6Nafz2w1iwzLHm9i6wnI7v2EyQuNgiEVDHHQNPgcO1bUG3AliboK8fQ2PG1PIGPRIyrGFCPR2QtUZzwOtt1Uyic0vZF0mQWj~0DiVxHwmlwf2lkKVtRaLWbxwHmd7Hbyoo5RiiqH6bzwoFsC2A__" alt="" width="150" style="display: block; max-width: 100%;" />
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Send email with HTML content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            bcc: adminEmails,
            subject: "Nouvel signalement",
            html: htmlEmail,
            // Include plain text alternative for email clients that don't support HTML
            text: `Bonjour,

Un nouvel problème a été signalé. Merci de le consulter dès que possible.

Localisation : ${interventionData.location || "Non spécifiée"}
Description : ${interventionData.description || message}

Cordialement,
ESI LOGIS`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return { success: true };
        } catch (error) {
            logger.error("Error sending email", error);
            return {
                success: false,
                message: "Error sending email, but notifications were saved",
            };
        }
    } catch (error) {
        logger.error("Error sending notification", error);
        throw new Error(`Error sending notification: ${error.message}`);
    }
}

async function sendNotificationToTechnician(techEmail, location, description, message) {
    try {
        // Create notifications in the database
        const notificationsData = {
            userId: admin.id,
            message,
            createdAt: new Date(),
            read: false,
        };

        await prisma.notification.createMany({
            data: notificationsData,
        });

        // Check if email credentials are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            logger.warn("Email credentials not configured");
            return {
                success: true,
                message:
                    "Notifications saved but emails not sent due to missing configuration",
            };
        }

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Create HTML email with replaced placeholders
        const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Nouvel Ordre de Travail</title>
<!--[if mso]>
<style type="text/css">
  table {border-collapse: collapse;}
  td {font-family: Arial, sans-serif;}
</style>
<![endif]-->
<style type="text/css">
  /* Reset styles */
  body, table, td, p {
    margin: 0;
    padding: 0;
  }
  
  /* Base styles */
  body {
    font-family: Arial, sans-serif;
    background-color: #fdfafaad;
    color: #000;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  
  /* For Outlook */
  table {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  
  /* Image handling */
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    display: block;
    height: auto;
    outline: none;
    text-decoration: none;
  }
  
  /* Responsive styles */
  @media screen and (max-width: 600px) {
    .email-container {
      width: 100% !important;
    }
    
    .email-content {
      padding: 20px !important;
    }
    
    .footer-content {
      padding-left: 20px !important;
    }
    
    .deco-image {
      width: 120px !important;
    }
    
    .logo-image {
      width: 80px !important;
    }
  }
</style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fdfafaad; color: #000; width: 100%;">
<!-- Email container -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <!-- Main content wrapper -->
      <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="background-color: #edededc4;">
        
        <!-- Top-left decoration -->
        <tr>
          <td align="left" style="padding: 0;">
            <img class="deco-image" src="https://ci3.googleusercontent.com/meips/ADKq_Nanu-Mi6j_nU1L9b3tJtxdCjgLGYAzcI-OFHqQF9SwW0KPGTRXTbrYZnggRxAiKzalhtTPciOls-_PEjPcjMKbJ04sCvTfHxNSi6muwexFAOlObMt8ri0_Xlkb8pICXfW0OwoEqmM_7r3UFtK6yEdYljctArcgZAm3u8U2P-PNpInOE1FrX3lEwsydoUC0r-klEr1kMRonXQ-Y_RE7h4rnkU3q7AwelFlIol4o7O25V2K0mMCha5NJh-PhGLWQCwChelolTVFUC7Y7ZFtDONvMwEoEe_Q7iHODsZUlizYB3wtrxyaVcgnuxCdEWbFbOdOGGJqU3nuQ5MvDuiwtaLXs12McaxpahSmkPVR17fsUV0Qcfin01fRgQQCkugaghbTP8Cj8pgo3TGgd6sDVWoERfUfLaL42O3UOC9ovvXl0kgvO97ioFWajoz4yze-_9EcVtiMC6nO-BtuFaii6INj6jo3nXlNtSObv4tAkkIVTj-FSid3o2aiMoegCewg0N6jCOCiZalPrK7GRrrb8PnZbjHeiRA22lAiRvm6XpANw6nPwhp8BFkV2SGYnbx-5UwnXi764ACJTC2ZWOsoDjh2OGvkblJVvW-3z9TIE08GyWP43OH6m6PZP_fQqVxBe4xhKiAwQ=s0-d-e1-ft#https://media-hosting.imagekit.io/61d2ca6f4b8b48ad/deco2.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=2AhShgwz24eZvGl8l-FWEJLApjcPpCpDyPJ4Db-UWQGB1-f0Xn03v1~mKH99cd4o8RWa7b4qLMrgQ7wevbWI6PU8eBk-sZ4RQXJX3fk67ik0qeI9mrJVD2fAd5wnBxTnjT5GYhhOjU--BZqvJimR51Di-x5KJ75SQ2ZWQY~thRRH2J-IrEgPWkAAzV34ULycYTQqnDehK618-nLuzLOTWrNxVh5UkVMbVbJZZjCyg1aE2NXMnWwfy20vCCrnNKCFEafRFshd4VMUKi74awV4L-V4A85FoItmpHQJzqqK1UrvuM~THL5ZEgSJFIABP~0TcALP1WqdxSbpTKWVFCerOA__" alt="" width="150" style="display: block; max-width: 100%;" />
            
          </td>
        </tr>

        <!-- Logo -->
        <tr>
          <td align="center" style="margin-bottom: -30px;">
            <img class="logo-image" src="https://ci3.googleusercontent.com/meips/ADKq_NYCDaLgbi4DHESKDmyP9-ByrfyqYdJXkzY9ce36irEXclGPpLc2ltqADMam8pQO_Yz-YK0-fuB7hgmiTzI0lDrSnPE37XT2PXPvjM125qqQ4zJpOVH-Q2wV7v_Ogn4HHMOB5JPpf66HiNB3SInIjKeRdUOhDhhyRr0ZjBoSc2ZMzg13YajCef_qzmWYwIqNgTax6rS_ilf4ZToIH17DcGEkzR_s9Ehv33IDmkzdRmrCRLF8Iu-o3ab-J3RAjFiH-LH7HGxfG6HrEGD3uLvzfmO6ZMo9CXDcMhTN5byZA2FAwb-f4kyRA53cS02jMcnfdY2I-CTpUd7jydpN9M_4W2BZmwYVa4QlpsT16tCtkf72b0bUegW14a2gAojjlqCL4et29_hzOgyO7BcSlYoVL9nICvR13d51UCVsa5HbVqmFZoufIrKJgYpePrhwwSKr7HftdIT88ZwXiRUnnoxJvH0TxxoiJBNNP6KduvWcL0YPDhewXHpDWxKn6K-Qd2o7BExaaCEu3zF5c8oAVdKzNhjVHifxjpNyOVUBOtGIoKGrlZWjAGSOoKd7XiPG_cUC5nGPtPZgA42fjwheD0axv2wuIMVtlyI9sAtODrN0LBZSTb8_ZdmsD8VcFqOlmKm4YN6ZQ6lkXZK7=s0-d-e1-ft#https://media-hosting.imagekit.io/4e44c6cf98794fc4/LOGOBLACK.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=TGBwoDUk6rVjCfn0ppb92DPdgE1P22M04~BmWk6pkXxPRQOVhohVFNRmSOK36aStaebca12lrahXWfZq2HXEeeksOm5Yd86Hyi1j7S2DIk9NHYuwrJgroDoTFqxoDt3DNB~Q8T~oBMxlLchflZBSes7wM0IyLhFVJHgHmxOtlrF~XHBWVSXJ2KaZt0oiTeX5Vx7emucjWHmObsD1qY1XBLG2Eyk0BGQ27yuEu6shbrep4X-XqPV24TaRcM3konx7hO9TxfLLz6eg0HrPneJrqOsav2n-ecENahzA8ckQlmWqTlOTK9kZA28A~VLKcc34rObJzdQVmKS9HDzOn-GlEA__" alt="ESI LOGIS" width="100" style="display: block; max-width: 100%;" />
          </td>
        </tr>

        <!-- Main content -->
        <tr>
          <td class="email-content" style="padding: 30px 40px 40px 40px;">
            <p style="margin-top: 0; margin-bottom: 16px;">Bonjour,</p>
            <p style="margin-top: 0; margin-bottom: 16px;">
              Un <a style="color: #007bff; text-decoration: none;">nouvel ordre de travail</a> vous a été attribué.
                Merci de le consulter et d'intervenir dès que possible.
            </p>
            <p style="margin-top: 0; margin-bottom: 16px;">
              Localisation : ${interventionData.location || "Non spécifiée"}<br>
              Description : ${interventionData.description || message}
            </p>
            <p style="margin-top: 0; margin-bottom: 0;">
              Cordialement,<br>ESI LOGIS
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="footer-content" style="padding-left: 40px; font-size: 14px;">
            <p style="margin-top: 0; margin-bottom: 16px;">
              📞 Téléphone : +213 123456789<br>
              🌐 Site web : <a href="http://www.esilogis.dz" style="color: #007bff; text-decoration: none;">www.esilogis.dz</a>
            </p>
          </td>
        </tr>

        <!-- Bottom-right decoration -->
        <tr>
          <td align="right" style="padding: 0;">
            <img class="deco-image" src="https://ci3.googleusercontent.com/meips/ADKq_Naim5s4v6dlppkPtsT69TidI-o_NMGC_Tr_T1YJhnqGTQls0LXgv_iITkvkLKuQyYCi6xnle4FkOf_bndQ7_bGgmfLAdo1RFn4b8AlU1yFO3CWwk7EkBMzOUVZn67rvZF1LlZ2px3n2HqtJgALgsW04cqgwQfYiIIeayaixNZ8VkfETXDN6o_7zHWsO1_ranxlTsywPHMCTK3vhzrYJISrFjZhGj4nkBKmNhbJICXb4mtmPtz1iTiYe_Y7Np-0A7W081HtaFn2aUuFYz0nrABA3Rt9bw0pCtQm9dLzUS_zIOUS6xus4r4l2EqH2wNkwjZFepIESBbERIDRmI4PeH_sskIskanAYlBgb46YR0oMrWBtlr8LCWwgZPMewrDn6HPRGBvwcit_sLwwK4U01NlwW3q3tIQG09Fm-uqf53AYr9WU0rPhUEBH1e-3Gpl1bLjALhHel2qBDZ7bssWho7_gpYScy7hGm9sKen0_zktyOGcgOQurMrw2D9uv9n4PDcbVC_l-zOZpdhubn6zC6Cz07sEev_weQYn1ewlQ_HCgSOxk9LGjnJYYydTVo0Lmr-X9PZlbpM1SWYVYHfBAHxxukfCVLxutDr58HtaCsjmPHz4AtmwggNwuZ7tnwcHpnlt58nB8=s0-d-e1-ft#https://media-hosting.imagekit.io/c9e35a8c7853427d/deco3.png?Expires=1841002246&amp;Key-Pair-Id=K2ZIVPTIP2VGHC&amp;Signature=DCr6EjPg0TMdfptT2JlV63baJD3Aj64QfBXxJMwzH~UB3Llh3gobBUuWeU1bcNSzRTCINOJRA5OOH~IiS7JMSw3WLFhWxqeaF5CuetfC0Pef7lX--XZItT7KfBa9~uSH7sIWYgxIEcaZQlyxD0pOg2e1CYOetbFCRvO573aknIPkyoq8ZhIaadeujiDmj72eGZae6Nafz2w1iwzLHm9i6wnI7v2EyQuNgiEVDHHQNPgcO1bUG3AliboK8fQ2PG1PIGPRIyrGFCPR2QtUZzwOtt1Uyic0vZF0mQWj~0DiVxHwmlwf2lkKVtRaLWbxwHmd7Hbyoo5RiiqH6bzwoFsC2A__" alt="" width="150" style="display: block; max-width: 100%;" />
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

        // Send email with HTML content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            bcc: techEmail,
            subject: "Nouvel signalement",
            html: htmlEmail,
            // Include plain text alternative for email clients that don't support HTML
            text: `Bonjour,
Un nouvel ordre de travail vous a été attribué.
Merci de le consulter et d'intervenir dès que possible.

Localisation : ${interventionData.location || "Non spécifiée"}
Description : ${interventionData.description || message}

Cordialement,
ESI LOGIS`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return { success: true };
        } catch (error) {
            logger.error("Error sending email", error);
            return {
                success: false,
                message: "Error sending email, but notifications were saved",
            };
        }
    } catch (error) {
        logger.error("Error sending notification", error);
        throw new Error(`Error sending notification: ${error.message}`);
    }
}

module.exports = {
    createNotification,
    sendNotificationToAdmins,
    sendNotificationToTechnician,
};
