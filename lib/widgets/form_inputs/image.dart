import 'dart:io';
import 'package:http/http.dart' as http;

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';

class ImageInput extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return _ImageInputState();
  }
}

class _ImageInputState extends State<ImageInput> {
  File _image;
  void _getImage(BuildContext context, ImageSource source) {
    ImagePicker.pickImage(source: source, maxWidth: 400.0).then((File image) {
      Navigator.pop(context);
      setState(() {
        _image = image;
      });
    });
  }

  void _setImage(File image){

  }

  Future<Map<String, String>> uploadImage(File image, {String imagePath}) async {
    // image.path -> this path is the path where your image stored in your device.
    final mimeTypeData = lookupMimeType(image.path).split('/');

    final imageUploadRequest = http.MultipartRequest('POST', 
      Uri.parse('https://us-central1-flutter-project-fd91b.cloudfunctions.net/storeImage'));
    final file = await http.MultipartFile.fromPath(
      'image', 
      image.path, 
      contentType: MediaType( 
        mimeTypeData[0], 
        mimeTypeData[1]
        )
      );

    imageUploadRequest.files.add(file);

    if (imagePath != null){
      imageUploadRequest.fields['imagePath'] = Uri.encodeComponent(imagePath);
      

    }

  }

  void _openImagePicker(BuildContext context) {
    showModalBottomSheet(
        context: context,
        builder: (BuildContext context) {
          return Container(
            height: 130,
            child: Column(
              children: <Widget>[
                SizedBox(
                  height: 10.0,
                ),
                Text('Pick an Image',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(
                  width: 5.0,
                ),
                FlatButton(
                  child: Text(
                    'Use camera',
                  ),
                  onPressed: () {
                    _getImage(context, ImageSource.camera);
                  },
                ),
                SizedBox(
                  width: 5.0,
                ),
                FlatButton(
                  child: Text('Use gallery'),
                  onPressed: () {
                    _getImage(context, ImageSource.gallery);
                  },
                ),
              ],
            ),
          );
        }
      );
  }

  @override
  Widget build(BuildContext context) {
    final buttonColor = Theme.of(context).accentColor;
    // TODO: implement build
    return Column(
      children: <Widget>[
        OutlineButton(
          borderSide: BorderSide(color: buttonColor, width: 2.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(
                Icons.camera_alt,
                color: Colors.black,
              ),
              SizedBox(width: 5.0),
              Text(
                'Add Image',
                style: TextStyle(color: Colors.black),
              ),
            ],
          ),
          onPressed: () {
            _openImagePicker(context);
          },
        ),
        SizedBox(
          height: 10.0,
        ),
        _image == null 
        ? Text('Pick an image')
        : Image.file(
          _image,
          fit: BoxFit.cover,
          height: 300,
          width: MediaQuery.of(context).size.width,
        )
      ],
    );
  }
}
