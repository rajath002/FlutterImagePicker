import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ImageInput extends StatefulWidget {
  @override
    State<StatefulWidget> createState() {
      return _ImageInputState();
    }
}

class _ImageInputState extends State<ImageInput> {

  void _getImage(BuildContext context, ImageSource source) {
    ImagePicker.pickImage(source: source, maxWidth: 400.0).then((File image){

    });
  }
  
  void _openImagePicker(BuildContext context){
    showModalBottomSheet(context: context, builder: (BuildContext context) {
      return Container(
        height: 130,
        child: Column(
          children: <Widget>[
            SizedBox(height: 10.0,),
            Text('Pick an Image', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(width: 5.0,),
            FlatButton(
              child: Text('Use camera',),
              onPressed: () {
                _getImage(context, ImageSource.camera);
              },
            ),
            SizedBox(width: 5.0,),
            FlatButton(
              child: Text('Use gallery'),
              onPressed: () {
                _getImage(context, ImageSource.gallery);
              },
            ),
          ],
        ),
      );
    });
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
                Icon(Icons.camera_alt, color: Colors.black,),
                SizedBox(width:5.0),
                Text('Add Image',
                  style: TextStyle(color:Colors.black),
                ),
              ],
            ),
            onPressed: () {
              _openImagePicker(context);
            },
          )
        ],
      );
    }
}