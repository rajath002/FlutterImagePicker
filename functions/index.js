const functions = require('firebase-functions');
const cors = require('cors')({origin:true});

//busboy - accepts incoming files
const Busboy = require('busboy');

const os = require('os'); 

//used to construct Absolute paths
const path = require('path'); // comes with node.js

//file system - package helps us to read the files
const fs = require('fs'); //comes with node.js

//uuid - unique id

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.storeImage = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        // !== used for value and type equality
        if(req.method !== 'POST'){
            return res.status(500).json({message:'not allowed'});
        } 

        if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')){
            return res.status(401).json({error:'Unauthorized'});
        }

        let idToken;
        //1st element is the Bearer and the second one would be the token
        idToken = req.headers.authorization.split('Bearer ')[1]; 

        const busboy = new Busboy({headers: req.headers});

        let uploadData;
        let oldImagePath;

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

            // tmpdir() - will give the temperory directory to store the files
            // then we store a file in there
            const filePath = path.join(os.tmpdir(), filename); 
            uploadData = {filePath:filePath, type: mimetype, name:filename};

            // we will store the data in the path - 
            // files will moved to the temperory storage
            file.pipe(fs.createWriteStream(filePath)); 
        });

        busboy.on('field', (fieldname, value) => {
            oldImagePath = decodeURIComponent(value);

        })

        busboy.on('finish', () => {
            // TODO complete this method
        })
        
    }) ;
}) 