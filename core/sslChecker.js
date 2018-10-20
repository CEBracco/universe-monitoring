require("date-format-lite");

var logger =  require('../logger.js');
var municipalities = [];
var sslValidFunction = function(){};
var sslNotValidFunction = function(){};
var daysTolerance = -1;

function isMonitoringEnabled(municipality, excludeNonSSL = false){
  if(excludeNonSSL){
    return !eval(/(http:\/\/)?[0-9]{1,3}[\.\/].*/g).test(municipality.urlSem) && municipality.monitor;
  } else {
    return municipality.monitor;
  }
}

function validateMunicipalitiesSsl(){
  logger.debug("Running SSL certs validation...");
  for (var i = 0; i < municipalities.length; i++) {
    if(isMonitoringEnabled(municipalities[i], true)){
      validateMunicipalitySsl(municipalities[i]);
    }
  }
}

function validateMunicipalitySsl(municipality){
  var sslCertificate = require("get-ssl-certificate")

  sslCertificate.get(municipality.urlSem.replace('https://',''))
    .then(function (certificate) {
      if(sslCertificateIsValid(certificate)){
        sslValidFunction(municipality,sslCertificateIsGoingToExpire(certificate),certificate);
      } else {
        sslNotValidFunction(municipality,certificate);
      }
    })
    .catch(function(){
      logger.warn(`${municipality.nombre}, Problems obtaining SSL status.`)
    });
}

function sslCertificateIsValid(certificate){
  var originalToDate = new Date(certificate.valid_to);
  return new Date() < originalToDate;
}

function sslCertificateIsGoingToExpire(certificate){
  var originalToDate = new Date(certificate.valid_to);
  var comparableToDate = originalToDate.add(daysTolerance, "days");
  return new Date() >= comparableToDate;
}

function execute(instances,checkSslInterval,sslWarningDaysTolerance,sslValidFn,sslNotValidFn){
  sslValidFunction = sslValidFn;
  sslNotValidFunction = sslNotValidFn;
  daysTolerance = sslWarningDaysTolerance;
  municipalities = instances;
  validateMunicipalitiesSsl();
  setInterval(validateMunicipalitiesSsl, checkSslInterval * 60000);
}

module.exports = {
  execute:execute
}