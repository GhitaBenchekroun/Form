const express = require("express");
const bodyParser = require("body-parser");
const jsforce = require("jsforce");
const multer = require("multer");
const cors = require("cors");

const app = express();
const port = 3001;

const storage = multer.memoryStorage(); // Store files in memory for direct streaming to Salesforce

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
var conn = new jsforce.Connection({
  oauth2: {
    loginUrl: "https://test.salesforce.com",
    clientId:
      "3MVG9CG8tifMyyO2SWhr8elmMZNASRiAR1prGlBlKXSAX5wT2GOew6xvBMaxm5sO.Wkx0GNMrSe9.ny0_sJ9F",
    clientSecret:
      "D51631199B2DE157AF116CBE11919DA4717BD9B4051F20515E97BEFC25AF4445",
    redirectUri: "https://www.google.com/",
  },
});
conn.login(
  "houssam.oub@oreivaton.com.dev2",
  "Project123fDlx4RIzngAsaN1vCPO2CHBF",
  function (err, userInfo) {
    if (err) {
      return console.error(err);
    }

    console.log(conn.accessToken);
    console.log(conn.instanceUrl);
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);
  }
);

app.use((req, res, next) => {
  if (!conn.accessToken || !conn.instanceUrl) {
    res.status(401).send('Authentication required.');
  } else {
    // Vérifie si le token est toujours valide
    conn.identity((err, response) => {
      if (err) {
        console.log('Access Token expired. Refreshing...');
        conn.refreshAccessToken((err, oauthResponse) => {
          if (err) {
            return console.error('Error refreshing access token:', err);
          }
          console.log('Access Token refreshed:', oauthResponse.access_token);
          next();
        });
      } else {
        next();
      }
    });
  }
});


// function deleteExistingSkills(leadId, newSkills) {
//   // Query and delete all existing skills associated with the lead
//   conn.query(
//     `SELECT Id FROM Skill__c WHERE Lead__c = '${leadId}'`,
//     (qErr, qRes) => {
//       // Collect all skill Ids to delete
//       const skillIds = qRes.records.map((skill) => skill.Id);
//       if (skillIds.length > 0) {
//         conn.sobject("Skill__c").del(skillIds, (delErr, delRes) => {
//           if (delErr) {
//             console.error("Error deleting skills:", delErr);
//             return res.status(500).send("Error deleting skills in Salesforce");
//           }
//           console.log("Deleted existing skills for lead ID:", leadId);
//           // After deletion, create new skills
//           createSkills(leadId, newSkills);
//         });
//       } else {
//         // If no skills to delete, directly create new ones
//         createSkills(leadId, newSkills);
//       }
//     }
//   );
// }
function normalizeSkillName(skillName) {
  return skillName.replace("SKILL--", "").toLowerCase();
}
function updateSkills(leadId, newSkills, res) {
  // Query all existing skills associated with the lead
  conn.query(
    `SELECT Id, Name FROM Skill__c WHERE Lead__c = '${leadId}'`,
    (qErr, qRes) => {
      if (qErr) {
        console.error("Error querying skills:", qErr);
        return res.status(500).send("Error querying skills in Salesforce");
      }

      // Collect all existing skill names to a set for quick lookup
      const existingSkillNames = new Set(
        qRes.records.map((skill) => normalizeSkillName(skill.Name))
      );
      console.log("existing skill name", existingSkillNames);
      // Filter new skills to include only those that do not exist
      const skillsToAdd = newSkills.filter(
        (skill) => !existingSkillNames.has(skill.name.toLowerCase())
      );
      console.log("New skills", skillsToAdd);

      // Create new skills as provided in the request
      createSkills(leadId, skillsToAdd, res);
    }
  );
}

function createSkills(leadId, skills) {
  // Create new skills as provided in the request
  if (skills) {
    Object.keys(skills).forEach((index) => {
      const skill = skills[index];
      conn.sobject("Skill__c").create(
        {
          Name: skill.name,
          Skill_type__c: skill.type,
          Lead__c: leadId,
        },
        (err, result) => {
          if (err || !result.success) {
            if (err.name === "FIELD_CUSTOM_VALIDATION_EXCEPTION") {
              return res.status(400).json({
                success: false,
                errorType: err.name,
                errorMessage: err.message,
              });
            } else {
              console.error("Error creating skill:", err);
            }
          } else {
            //console.log("Created skill with ID:", result.id);
          }
        }
      );
    });
  }
}

// async function getCurrentVersionNumber(conn, leadId, baseFileName) {
//   // First, find the ContentDocumentId linked to the given Lead
//   const linkQuery = `
//       SELECT ContentDocumentId FROM ContentDocumentLink
//       WHERE LinkedEntityId = '${leadId}' AND ContentDocument.Title LIKE '${baseFileName}%'
//       ORDER BY ContentDocument.Title DESC LIMIT 1
//   `;
//   try {
//       const linkResult = await conn.query(linkQuery);
//       if (linkResult.records.length > 0) {
//           // Now fetch the latest version number from ContentVersion using the found ContentDocumentId
//           const documentId = linkResult.records[0].ContentDocumentId;
//           const versionQuery = `
//               SELECT Title FROM ContentVersion
//               WHERE ContentDocumentId = '${documentId}'
//               ORDER BY Title DESC LIMIT 1
//           `;
//           const versionResult = await conn.query(versionQuery);
//           if (versionResult.records.length > 0) {
//             // Log all the fetched titles for examination
//             console.log('All fetched titles:', versionResult.records.map(r => r.Title));

//             const latestTitle = versionResult.records[0].Title;
//             console.log('Latest title:', latestTitle);

//             const versionMatch = latestTitle.match(/v(\d+)$/);
//             console.log('Version match:', versionMatch);

//             if (versionMatch && versionMatch[1]) {
//                 const currentVersion = parseInt(versionMatch[1], 10);
//                 const newVersion = currentVersion + 1;
//                 console.log(`Current version: ${currentVersion}, New version to be used: v${newVersion}`);
//                 return newVersion;
//             }
//         }
//         return 1; // If no versions found or no links, start with version 1

//       }
//       return 1; // If no versions found or no links, start with version 1
//   } catch (error) {
//       console.error('Failed to query the latest version number:', error);
//       throw error;  // Propagate the error up to allow caller to handle it
//   }
// }

async function getCurrentVersionNumber(conn, leadId, baseFileName, jobName) {
  const titlePattern = `${baseFileName}-${jobName}-v`;
  const linkQuery = `
      SELECT ContentDocumentId FROM ContentDocumentLink
      WHERE LinkedEntityId = '${leadId}' AND ContentDocument.Title LIKE '${titlePattern}%'
      ORDER BY ContentDocument.Title DESC LIMIT 1
  `;

  try {
    const linkResult = await conn.query(linkQuery);
    if (linkResult.records.length > 0) {
      const documentId = linkResult.records[0].ContentDocumentId;
      const versionQuery = `
              SELECT Title FROM ContentVersion
              WHERE ContentDocumentId = '${documentId}'
              ORDER BY Title DESC LIMIT 1
          `;
      const versionResult = await conn.query(versionQuery);
      if (versionResult.records.length > 0) {
        const latestTitle = versionResult.records[0].Title;
        const versionMatch = latestTitle.match(
          new RegExp(`${titlePattern}(\\d+)$`)
        );
        if (versionMatch && versionMatch[1]) {
          return parseInt(versionMatch[1], 10) + 1;
        }
      }
      return 1; // If no versions found, start with version 1
    }
    return 1; // If no ContentDocumentLinks found, start with version 1
  } catch (error) {
    console.error("Failed to query the latest version number:", error);
    throw error;
  }
}

async function uploadDocumentAndLinkToLead(req, leadId, jobName) {
  const baseFileName = req.file.originalname; // Include extension here for initial processing
  const timestamp = new Date().toISOString(); // ISO format timestamp
  const dateOnly = timestamp.slice(0, 10);

  // Get the current highest version number
  const currentVersionNumber = await getCurrentVersionNumber(
    conn,
    leadId,
    baseFileName,
    jobName
  );
  //const newVersionNumber = currentVersionNumber + 1;
  console.log('Job name',jobName)
  const fileTitle = `${baseFileName}-${jobName}-v${currentVersionNumber}`;
  const fileContent = req.file.buffer.toString("base64");
  conn.sobject("ContentVersion").create(
    {
      Title: fileTitle,
      PathOnClient: req.file.originalname,
      VersionData: fileContent,
      //FirstPublishLocationId: leadId
    },
    function (err, contentVersionResult) {
      if (err || !contentVersionResult.success) {
        console.error(err);
        return;
      }

      console.log("Created ContentVersion with ID: " + contentVersionResult.id);

      // Query the created ContentVersion to get the ContentDocumentId
      conn.query(
        `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${contentVersionResult.id}'`,
        function (qErr, qRes) {
          if (qErr || !qRes.records[0]) {
            console.error(qErr);
            return;
          }

          const contentDocumentId = qRes.records[0].ContentDocumentId;
          console.log("Content Document ID:", contentDocumentId);
          console.log("le id du lead", leadId);
          // Now create the ContentDocumentLink
          conn.sobject("ContentDocumentLink").create(
            {
              ContentDocumentId: contentDocumentId,
              LinkedEntityId: leadId,
              Visibility: "AllUsers",
            },
            function (linkErr, linkResult) {
              if (linkErr || !linkResult.success) {
                console.error(linkErr);
                return;
              }

              console.log(
                "Created ContentDocumentLink with ID: " + linkResult.id
              );
            }
          );
        }
      );
    }
  );
}

function createJobApplication(leadId, jobId, lastName) {
  console.log("create job");
  conn.sobject("JobApplication__c").create(
    {
      Lead__c: leadId,
      JobName__c: jobId,
      Name: `${jobId}.${lastName}`,
    },
    function (err, jobApplicationResult) {
      if (err || !jobApplicationResult.success) {
        if (err.name === "FIELD_CUSTOM_VALIDATION_EXCEPTION") {
          return res.status(400).json({
            success: false,
            errorType: err.name,
            errorMessage: err.message,
          });
        } else {
          console.error("Error creating job application:", err);
        }
      } else {
        console.log(
          "Created job application with ID:",
          jobApplicationResult.id
        );
      }
    }
  );
}

function normalizeCertificationName(certName) {
  if (!certName) return certName;
  // Remove 'CERTIFICATION-' prefix and trailing dash, then convert to lowercase
  let normalized = certName.replace(/^CERTIFICATION-/, "").replace(/-$/, "");
  return normalized.toLowerCase();
}

function updateCertifications(certificationsArray, leadId) {
  if (!certificationsArray || certificationsArray.length === 0) {
    console.log("No certifications to process.");
    return;
  }

  // First, fetch existing certifications for the lead
  conn.query(
    `SELECT Name, Certification__c FROM Skill__c WHERE Lead__c = '${leadId}' AND RecordTypeId = '012Jz0000000gx1IAA'`,
    (err, result) => {
      if (err) {
        console.error("Error querying existing certifications: ", err);
        //return res.status(500).send("Error querying certifications in Salesforce");
      }

      // Create a set of existing certification names for quick lookup
      const existingCertifications = new Set(
        result.records.map((cert) => normalizeCertificationName(cert.Name))
      );
      console.log("existingCertifications", existingCertifications);
      console.log('certiication array',certificationsArray)
      // Filter out certifications that already exist
      
      // const certificationsToAdd = certificationsArray.filter((cert) =>
      // !existingCertifications.has(cert.name.toLowerCase())
      // );
      const certificationsToAdd = certificationsArray.filter((cert) => {
        // Convert the certification name to lowercase.
        const certNameLower = cert.name.toLowerCase();
      
        // Check if any word in existingCertifications is a substring of the certification name.
        for (const existingCert of existingCertifications) {
          if (certNameLower.includes(existingCert) || existingCert.includes(certNameLower)) {
            return false; // They have a common word, so don't add this certification.
          }
        }
        return true; // No common words, so this certification can be added.
      });
      
      console.log("certificationsToAdd", certificationsToAdd);
      // Proceed to create new certifications
      createCertifications(certificationsToAdd, leadId);
    }
  );
}

function createCertifications(certificationsArray, leadId) {
  if (!certificationsArray || certificationsArray.length === 0) {
    console.log("no certifications");
    return;
  }

  certificationsArray.forEach((certif, index) => {
    conn.sobject("Skill__c").create(
      {
        Name: certif.name,
        Lead__c: leadId,
        Certification__c: certif.type,
        RecordTypeId: "012Jz0000000gx1IAA",
      },
      function (err, skillResult) {
        if (err || !skillResult.success) {
          if (err.name === "FIELD_CUSTOM_VALIDATION_EXCEPTION") {
            return res.status(400).json({
              success: false,
              errorType: err.name,
              errorMessage: err.message,
            });
          } else {
            console.error("Error creating skill for certification:", err);
          }
        } else {
          //console.log("Created skill with ID:", skillResult.id);
        }
      }
    );
  });
}

app.post("/submit-form", upload.single("cv"), async (req, res) => {
  try {
    //console.log("request", JSON.stringify(req.body));

    if (!req.file) {
      console.log(req.body);
      return res.status(400).send("No file uploaded.");
    }
    const {
      lastName,
      email,
      Phone,
      recordType,
      typeCandidat,
      jobId,
      Skills,
      Certifications,
      lastEstablishment__c,
      LinkedInAccount__c,
      yearOfExperience__c,
      educationalLevel__c,
      jobName,
    } = req.body;

   console.log('job name',jobName)
    let certificationsArray;
    //if certifications list comes empty from client it becomes null
    const certificationsEmpty = req.body.CertificationsEmpty;

    if (certificationsEmpty === "true") {
      // Handle the case where no certifications were provided
      console.log("No certifications provided.");
    } else {
      certificationsArray =
        Object.keys(Certifications).length > 0
          ? Object.keys(Certifications).map((index) => {
              return {
                name: Certifications[index].type,
                type: Certifications[index].type,
              };
            })
          : [];
    }
    //console.log("certificatios", certificationsArray);

    // Skills will be an object with keys as indices if parsed correctly
    const skillsArray = Object.keys(Skills).map((index) => {
      return { name: Skills[index].name, type: Skills[index].type };
    });

    console.log("Attempting to create Salesforce lead...");

    /*If Lead already exists update */
    conn.query(
      `SELECT Id, Email FROM Lead WHERE Email = '${email}' LIMIT 1`,
      async (queryErr, queryResult) => {
        let leadId = null;
        if (queryResult.totalSize > 0) {
          // Lead exists, so we will update it
          leadId = queryResult.records[0].Id;
          conn.sobject("Lead").update(
            {
              Id: leadId,
              LastName: lastName,
              MobilePhone: Phone,
              RecordTypeId: recordType,
              LeadSource: "Website",
              Type__c: typeCandidat,
              Email: email,
              Job__c: jobId,
              LinkedInAccount__c: LinkedInAccount__c,
              lastEstablishment__c: lastEstablishment__c,
              yearOfExperience__c: yearOfExperience__c,
              educationalLevel__c: educationalLevel__c,
            },
            (updateErr, updateResult) => {
              if (updateErr || !updateResult.success) {
                if (err.name === "FIELD_CUSTOM_VALIDATION_EXCEPTION") {
                  return res.status(400).json({
                    success: false,
                    errorType: err.name,
                    errorMessage: err.message,
                  });
                } else {
                  console.error("Error updating lead:", updateErr);
                  return res
                    .status(500)
                    .send("Error updating lead in Salesforce");
                }
              }

              console.log("Updated lead with ID:", leadId);
              //deleteExistingSkills(leadId, skillsArray);
              updateSkills(leadId, skillsArray, res);
              createJobApplication(leadId, jobId);
              uploadDocumentAndLinkToLead(req, leadId, jobName);
              updateCertifications(certificationsArray, leadId);
              console.log("type of response", updateResult);
              return res.status(201).json({
                success: true,
              });
            }
          );
        } else {
          // Lead does not exist, so we will create a new one
          console.log("lead does not already exist !!");
          console.log("email", Phone);
          conn.sobject("Lead").create(
            {
              Id: leadId,
              LastName: lastName,
              MobilePhone: Phone,
              RecordTypeId: recordType,
              LeadSource: "Website",
              Type__c: typeCandidat,
              Job__c: jobId,
              Email: email,
              LinkedInAccount__c: LinkedInAccount__c,
              lastEstablishment__c: lastEstablishment__c,
              yearOfExperience__c: yearOfExperience__c,
              educationalLevel__c: educationalLevel__c,
            },

            function (err, leadResult) {
              if (err || !leadResult.success) {
                if (err.name === "FIELD_CUSTOM_VALIDATION_EXCEPTION") {
                  return res.status(400).json({
                    success: false,
                    errorType: err.name,
                    errorMessage: err.message,
                  });
                } else {
                  console.log("erreur  ", err);

                  res.status(400).json({
                    success: false,
                    errorType: err.name,
                    errorMessage: err.message,
                  });
                  return;
                }
              }
              console.log("Created lead with ID: " + leadResult.id);
              //Create Job application
              createJobApplication(leadResult.id, jobId);
              // Create related skills
              createSkills(leadResult.id, skillsArray);
              //Create certifications
              createCertifications(certificationsArray, leadResult.id);
              //upload documents
              uploadDocumentAndLinkToLead(req, leadResult.id, jobName);

              //res.status(201).send('created').json()
              return res.status(201).json({
                success: true,
              });
            }
          );
        }
      }
    );
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
