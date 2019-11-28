const jsforce = require('jsforce');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const cred = require('./credentials');

const conn = new jsforce.Connection();

const accountName = 'Test Account Playground';

const p = path.join(path.dirname(process.mainModule.filename), 'data.json');

// Connexion à SF avec mon Username et password (+ acces token)
conn.login(cred.username, cred.password, (err, res) => {
  if (err) {
    console.log('ERROR 1 => ', err);
  }

  console.log('ACCESS TOKEN => ', conn.accessToken);
  console.log('INSTANCE URL => ', conn.instanceUrl);
  console.log('USER ID => ', res.id);
  console.log('ORG ID => ', res.organizationId);

  // Query pour retrouver l'account nommé 'Test Account Playground' dans mon org SF
  conn.query(
    `SELECT Id, Name, Phone FROM Account WHERE Name='${accountName}'`,
    (err, res) => {
      if (err) {
        console.log('ERROR 2 => ', err);
      }

      if (res.records.length > 0) {
        console.log('REPONSE ACCOUNT => ', res.records[0]);

        // J'enregistre l'account dans une variable account
        const account = res.records[0];

        // Je query sur les opportunités pour retrouver la première qui est rattachée à l'account grâce à l'id de l'account
        conn.query(
          `SELECT Id, Name, CloseDate FROM Opportunity WHERE AccountId='${account.Id}'`,
          (err, res) => {
            if (err) {
              console.log('ERROR 3 => ', err);
            }
            console.log('REPONSE OPPORTUNITY => ', res);

            // J'enregistre l'opportunité rattachée à l'account dans une variable
            const opportunity = res.records[0];

            // Je répète la même opération avec une query pour retrouver le premier contact rattaché à l'account
            conn.query(
              `SELECT Id, Name FROM Contact WHERE AccountId='${account.Id}'`,
              (err, res) => {
                if (err) {
                  console.log('ERROR 4 => ', err);
                }
                console.log('REPONSE CONTACT => ', res);
                // Même opération, j'enregistre le contact dans une variable
                const contact = res.records[0];

                // Ensuite j'enregistre Id et Name de l'account + opportunité + contact dans un tableau
                const data = {
                  accountId: account.Id,
                  accountName: account.Name,
                  opportunityId: opportunity.Id,
                  opportunityName: opportunity.Name,
                  contactId: contact.Id,
                  contactName: contact.Name
                };

                // Ici je vérifie si le fichier JSON existe déjà en vérifiant le path
                fs.stat(p, err => {
                  // Si il existe alors je compare le contenu du fichier json avec celui du mon objet data
                  if (!err) {
                    // Je lis d'abord mon JSON et le parse pour pouvoir le comparer à l'obj data
                    fs.readFile(p, (err, fileContent) => {
                      const jsonData = JSON.parse(fileContent);
                      // Ensuite je boucle pour comparer les 2 objets
                      for (const prop in jsonData) {
                        // Si ils ne sont pas égaux, alors je réécris le fichier json avec le contenu de mon obj data (qui contient mes data de SF)
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
                  // Si mon fichier JSON n'existe pas, alors je l'écris/créé avec le contenu de mon obj data
                  else {
                    fs.writeFile(p, JSON.stringify(data), err => {
                      if (err) {
                        console.log('ERROR 6 => ', err);
                      }
                    });
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

// Ici je me sert d'express pour afficher le contenu de mon JSON sur une page HTML
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
