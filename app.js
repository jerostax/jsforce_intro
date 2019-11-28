const jsforce = require('jsforce');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const cred = require('./credentials');

const conn = new jsforce.Connection();

const accountName = 'Test Account Playground';

const p = path.join(path.dirname(process.mainModule.filename), 'data.json');

// Connexion à SF
conn.login(cred.username, cred.password, (err, res) => {
  if (err) {
    return console.log('ERROR 1 => ', err);
  }

  console.log('ACCESS TOKEN => ', conn.accessToken);
  console.log('INSTANCE URL => ', conn.instanceUrl);
  console.log('USER ID => ', res.id);
  console.log('ORG ID => ', res.organizationId);

  conn.query(
    `SELECT Id, Name, Phone FROM Account WHERE Name='${accountName}'`,
    (err, res) => {
      if (err) {
        return console.log('ERROR 2 => ', err);
      }

      if (res.records.length > 0) {
        console.log('REPONSE ACCOUNT => ', res.records[0]);

        const account = res.records[0];

        conn.query(
          `SELECT Id, Name, CloseDate FROM Opportunity WHERE AccountId='${account.Id}'`,
          (err, res) => {
            if (err) {
              return console.log('ERROR 3 => ', err);
            }
            console.log('REPONSE OPPORTUNITY => ', res);

            const opportunity = res.records[0];

            conn.query(
              `SELECT Id, Name FROM Contact WHERE AccountId='${account.Id}'`,
              (err, res) => {
                if (err) {
                  console.log('ERROR 4 => ', err);
                }
                console.log('REPONSE CONTACT => ', res);

                const contact = res.records[0];

                const data = {
                  accountId: account.Id,
                  accountName: account.Name,
                  opportunityId: opportunity.Id,
                  opportunityName: opportunity.Name,
                  contactId: contact.Id,
                  contactName: contact.Name
                };

                fs.readFile(p, (err, fileContent) => {
                  const jsonData = JSON.parse(fileContent);

                  for (const prop in jsonData) {
                    if (jsonData[prop] !== data[prop]) {
                      fs.writeFile(p, JSON.stringify(data), err => {
                        if (err) {
                          console.log('ERROR 5 => ', err);
                        }
                      });
                    }
                  }
                });
              }
            );
          }
        );
      }
    }
  );
});

app.get('/', (req, res, next) => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      return;
    }
    const data = { ...JSON.parse(fileContent) };
    res.send(`
      <style>
      body, ul {
        margin: 0;
        padding: 0;
        text-align: justify;
      }
      h2 {
        margin-left: 10%;
      }
      ul {
        list-style: none;
        margin-left: 10%;
      }
      li {
        margin: 1rem 0;
      }
      span {
        font-weight: bold;
      }
      </style>
      <h2> SF Account Data </h2>
      <ul>
        <li>Nom de l'account : <span>${data.accountName}</span></li>
        <li>Id de l'account : <span>${data.accountId}</span></li>
        <li>Nom de l'opportunité attachée à l'account : <span>${data.opportunityName}</span></li>
        <li>Id de l'opportunité attachée à l'account : <span>${data.opportunityId}</span></li>
        <li>Id du contact attaché à l'account : <span>${data.contactId}</span></li>
        <li>Nom du contact attaché à l'account : <span>${data.contactName}</span></li>
      </ul>
    `);
  });
});

app.listen(3000);
