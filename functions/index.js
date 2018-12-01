const functions = require('firebase-functions');

//cors - used because the colud server receive the requsest from different server
const cors = require('cors')({origin:true});

//busboy - accepts incoming files
const Busboy = require('busboy');

const os = require('os'); 

//used to construct Absolute paths
const path = require('path'); // comes with node.js

//file system - package helps us to read the files
const fs = require('fs'); //comes with node.js

// this will help us to identify the image-authorization
const fbAdmin = require('firebase-admin');

//uuid - unique id = used to generate unique Id
const uuid = require('uuid/v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/**
 * We are storing project our project information in gcconfig
 */
const gcconfig = {
    projectId : 'flutter-project-fd91b',
    keyFilename : 'flutter-project.json'
};

/**
 * 'google-cloud/storage' yeilds a function, which will immiediatly executes by passing 'gcconfig'
 *  to that function in the paranthisis '(gcconfig)'
 *  this will configure the google cloud storage
 *  we use the admin permission set basically
 */
const gcs = require('@google-cloud/storage')(gcconfig);

/** Authenticating the app
 *  initializeApp()         -> To initialize all cloud functions in 'fbAdmin'.
 *  fbAdmin.initializeApp() -> To initialize the 'firebaseAdmin' package.                 
 *  cert()    -> Cert is a function where you pass your credential file you import it using 'require()'.
 *  require() -> will pull the file.
 */
fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(require('./flutter-project.json'))
});


// First all the cloud functions starts with 'exports'
// storeimage - userdefined, but it will be the part of API endpoint you target.
// req, res => are the parameters passed by the firebase.
// this function get executed whenever the API calls the 
/* Whenever the request reaches 'exports.storeImage' this function, an endpoint or fully qualified
 url will generated automatically.*/
exports.storeImage = functions.https.onRequest((req, res) => {

    // returning the cors - (cross origin request) object
    return cors(req, res, () => {

        // Condition_1 : we are expecting the only POST
        // !== used for value and type equality
        if(req.method !== 'POST'){
            return res.status(500).json({message:'not allowed'});
        } 

        // Condition_2 : if the request has NOT have authorization header? OR
        //               if it does NOT have authorization header = 'Bearer '?
        // Bearer = we will set the authorization header manually when we send the image later
        // and we will attach the header as the token. 
        // But before the token we has the word BEARER! and the empty space. This is the 
        // convention we use to describe the token as the BEARER token
        // there are other kinds of authorization too..
        // Here we just indicate the we use JWT(Json Web Token) token.
        if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')){
            return res.status(401).json({error:'Unauthorized'});
        }

        let idToken;

        // we are spliting and accessing the 1st array value, i.e 'token'
        // We got confirmation from the Condition_2 that, this request has the Token
        // 1st element is the 'Bearer ' and the second one will be the token
        idToken = req.headers.authorization.split('Bearer ')[1]; 

        const busboy = new Busboy({headers: req.headers});

        let uploadData;
        let oldImagePath;

        /* Busboy listening to the FILE event 
         * This will fire whenever Busboy finds a file in the incoming request. 
         * And it will execute the function, which is passed as the Second argument
         * Once the file is detected then buboy automatically give below arguments to the function
         * fieldname -> field which a file stored in
         * file      -> 
         * filename  -> name of the file itself
         * encoding  -> 
         * mimetype  -> 
         */
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

            /* tmpdir() - will give the temperory directory to store the files -> it require('os')
             * then we store a file in there
             * Every cloud functions has the temp storage and this is not the huge one.
             * os.tmpdir() -> it will give the path to the temperory directory 
             * firebase cloud functions provided
             */
            const filePath = path.join(os.tmpdir(), filename); 
            uploadData = {filePath:filePath, type: mimetype, name:filename};

            // we will store the data in the path - 
            // files will moved to the temperory storage
            // pippe() -> allows to perform actions on that file
            // this will move the incoming file to the temperory file storage
            file.pipe(fs.createWriteStream(filePath)); 
        });

        /* Busboy boy is listening to incoming fields, It means other data than file
         * we receive (fieldname, value) because we have key-value pair here.
         * We need this for updating the files
         * 
         */
        busboy.on('field', (fieldname, value) => {
            oldImagePath = decodeURIComponent(value);
        })

        /**
         * this will get executed when Busboy finishes reading the incoming request. 
         * Extracting all the fields and files
         * Then it will execute a function which doesn't take any arguments.
         * 
         */
        busboy.on('finish', () => {
            
            /**
             * bucket()  -> it is like a folder in your storage.
             * 'flutter-project-fd91b.appspot.com' -> value (bucket name) copied from the firebase storage.
             */
            const bucket = gcs.bucket('flutter-project-fd91b.appspot.com');

            // uuid() -> used to generate the 'unique id'
            const id = uuid();

            /** 
             * creating the imagePath 
             * uploadData.filename -> Extracted from the metadata (check busboy.on(file,-))
             */
            let imagePath = 'images/' + id + '-' + uploadData.filename;

            /** 
             * Only require when we update the image data
             * The below code will overwrite the existing Image with the new image
             */
            if(oldImagePath) {
                imagePath = oldImagePath;
            }

            /**
             * returning the result.
             * step 1. => accessing the auth() package, by calling the auth() function
             * step 2. => 
             *      verifyIdToken(idToken) -> Verifying the token is valid?
             * step 3. => If it is valid.
             *      then() -> we do something
             * step 4. => If it is not valid, then we also do something
             *      catch() -> catch the error such as invalid token
             * 
             * ****************************************************
             * 
             * step 2. => If we got valid token, then execute the step 3.
             *            It will give the decodedToken to 'then()'
             * step 3. =>
             * bucket.upload()
             *      1st argument will be the filepath.
             *          uploadData.filePath -> where we temperorily stored the file
             * 
             *      2nd will be the JavaScript Object with some additional configuration
             *          uploadType -> 
             *          imagePath  -> Where we want to store the file in the storage (bucket)
             *          matadata  -> Where we have the another metadata Object.
             *              contentType -> mimetype - which is automatically extrated by the busboy, 
             *                             so that we define which mimetype our file has.
             *              firebaseStorageDownloadToken ->
             *                              creating the link to the file so that later we can use that,
             *                              we are setting it up using the 'id'
             * 
             *  This will always returns a token, So we chain another 'then()' block.
             *  then() -> we are not receiving anything interested in, but we get know the 
             *            upload completed.
             *            so we return 'res.status(201)'
             *            201 - indicates that we are successful
             *  
             *            https://firebasestorage.googleapis.com/v0/b/ -> this is how the firebase bucket 
             *                          URL always looks like.
             *            id -> is the token used by the firebase to indentify the file
             *            imagePath -> added so that we can use this in the front end
             * 
             */
            return fbAdmin
                .auth()
                .verifyIdToken(idToken) 
                .then(decodedToken => {
                    return bucket.upload(uploadData.filePath, {
                        uploadType : 'media',
                        destination : imagePath,
                        metadata : {
                            metadata : {
                                contentType: uploadData.type,
                                firebaseStorageDownloadToken: id
                            }
                        }
                    });
                })
                .then(()=>{
                    return res.status(201).json({
                        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/' +
                        bucket.name + '/o/' +
                        encodeURIComponent(imagePath) +
                        '?alt=media&token=' +
                        id,
                        imagePath: imagePath
                    });
                })
                .catch(error => {
                    return res.status(401).json({error : 'Unauthorized'})
                });
        });

        /**
         * busboy.on(req.rawBody) -> this is how all the liseners will kick off.
         * this is the first line which will be executed.
         * which will tell the busboy to start parsing all these things by going through
         * all these listeners, Parse the request and do something, as defined in the listeners,
         * as it detects the files and fields and done parsing
         */
        return busboy.on(req.rawBody);
    }) ;
});