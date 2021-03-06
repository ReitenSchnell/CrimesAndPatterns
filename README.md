## DataPreprocess
This project is written in F# and makes following:

* Reads data from local csv files, using CSV Type Provider
* Cleans up the data and converts it to statistics-friendly format
* Implements Decision Tree algorithm for predictions
* Implements k-Nearest Neighbors for clusterization
* Trains the models and deserializes the results into JSON file

## Frontend
A SPA application, built with:

* Gulp
* AngularJS
* Bower
* D3.js

## Api
This is a REST API implementation based on lightweight web server Suave. It reads data from preprocessed JSON file and serves GET requests from client. Web.config was added to make this application be ready for deploy to IIS.