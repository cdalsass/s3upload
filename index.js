var file = require('fs');
var fs = require('fs');
var Q = require('q');
//var md5 = require('MD5');

var s3upload = {

    Authenticate: function(credentials) {
        this.AWS = require('aws-sdk'); 

        //console.console.log("update credentials with accessKeyId : " + credentials.accessKeyId + " secretAccessKey " + credentials.secretAccessKey + " region " + credentials.region);

        this.AWS.config.update(credentials);
    },

    UploadFile: function(bucket,remoteFilename, fileName, complete_func, error_func) {
        var s3 = new this.AWS.S3();
    
        var fileBuffer = file.readFileSync(fileName);
        var metaData = this.getContentTypeByFile(remoteFilename);
       
        s3.putObject({
            ACL: 'public-read',
            Bucket: bucket,
            Key: remoteFilename,
            Body: fileBuffer,
            ContentType: metaData
           // 'Content-MD5': md5(fileBuffer)
        }, function(error, response) {

            if (error) {
                error_func(error);
                return;
            }

            complete_func(response);

        });
    },


    getContentTypeByFile: function(fileName) {
        var rc = 'application/octet-stream';
        var fn = fileName.toLowerCase();

        if (fn.indexOf('.html') >= 0) rc = 'text/html';
        else if (fn.indexOf('.css') >= 0) rc = 'text/css';
        else if (fn.indexOf('.json') >= 0) rc = 'application/json';
        else if (fn.indexOf('.js') >= 0) rc = 'application/x-javascript';
        else if (fn.indexOf('.png') >= 0) rc = 'image/png';
        else if (fn.indexOf('.jpg') >= 0) rc = 'image/jpg';
        else rc = "text/html";

        return rc;
    },

    UploadTemporaryFile: function (config, tempfile, final_filename, bucket) {
        var deferred = Q.defer();
        this.Authenticate({
            accessKeyId: config.amazon.accessKeyId,
            secretAccessKey: config.amazon.secretAccessKey,
            region: config.amazon.region
        });
        this.UploadFile(bucket, final_filename, tempfile, function(err) {
            if (!err) {
                console.log.debug("Just stored an image with to amazon as " + final_filename);
            } else {
                console.log("hit error uploading file " + final_filename + " to amazon bucket " + bucket + " error: " + JSON.stringify(err));
            }
            fs.unlink(tempfile, function(err) {
                if (!err) {
                    console.log("just deleted " + tempfile);
                    deferred.resolve();
                } else {
                    deferred.reject(new Error(err));
                    //res.send(500, "unknown HTTP error");
                }
            })
        }, function(err) {
            console.log("error: " + err);
            deferred.reject(err);
        });
        return deferred.promise;
    }


}

if (typeof module != 'undefined') {
    module.exports = s3upload;
}