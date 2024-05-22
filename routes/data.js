var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const {Storage} = require('@google-cloud/storage');
const ExcelJS = require('exceljs');
var result = require('../models/result')
var con = mysql.createConnection(require("../config/bd"));

router.get('/currentDate', function(req, res, next) {
  con.query('SELECT fin FROM Data.ventasData LIMIT 1', function(error, results, fields){
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('Sin Data')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      res.status(200).send({
        fin : results[0].fin
      })
    }
  })
})

router.get('/checkOne', function(req, res, next) {
  var codigo = req.query.codigo;
  con.query('SELECT * FROM Data.ventasData WHERE CAST(codigo as UNSIGNED) = ? LIMIT 1', +codigo , function(error, results, fields) {
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('No Existe el usuario')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      res.status(200).send({
        codigo : results[0].codigo,
        nombre : results[0].nombre
      })
    }
  })
})


router.get('/', function(req, res, next) {
  var codigo = req.query.codigo;
  var min = req.query.min;
  var max = req.query.max;
  con.query('SELECT * FROM Data.ventasData WHERE CAST(codigo as UNSIGNED) = ? AND dia <= ? AND dia >= ? ORDER BY dia ASC', [+codigo, max, min], function (error, results, fields) {
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('Sin datos')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      var xy = result;
      for (const ob of resu) {
        xy.fin =  ob.fin;
        xy.codigo =  ob.codigo;
        xy.nombre =  ob.nombre;
        xy.clase =  ob.clase;
        xy.loc =  ob.loc;
        xy.locEnt =  ob.locEnt;
        xy.ppoAv =  xy.ppoAv + parseInt(ob.ppoAv);
        xy.ppoNC =  xy.ppoNC + ob.ppoNC;
        xy.ppoVC =  xy.ppoVC + ob.ppoVC;
        xy.ppo90 =  xy.ppo90 + ob.ppo90;
        xy.pprAv =  xy.pprAv + ob.pprAv;
        xy.pprNC =  xy.pprNC + ob.pprNC;
        xy.pprVC =  xy.pprVC + ob.pprVC;
        xy.ppr90 =  xy.ppr90 + ob.ppr90;
        xy.pTtAv =  xy.pTtAv + ob.pTtAv;
        xy.pTtNC =  xy.pTtNC + ob.pTtNC;
        xy.pTtVC =  xy.pTtVC + ob.pTtVC;
        xy.pVRAv =  xy.pVRAv + ob.pVRAv;
        xy.pVRNC =  xy.pVRNC + ob.pVRNC;
        xy.pVRVC =  xy.pVRVC + ob.pVRVC;
        xy.pLLAA =  xy.pLLAA + ob.pLLAA;
        xy.peTAv =  xy.peTAv + ob.peTAv;
        xy.peTNC =  xy.peTNC + ob.peTNC;
        xy.peTVC =  xy.peTVC + ob.peTVC;
        xy.peTUR =  xy.peTUR + ob.peTUR;
        xy.petUP =  xy.petUP + ob.petUP;
        xy.peV5A =  xy.peV5A + ob.peV5A;
        xy.peV5N =  xy.peV5N + ob.peV5N;
        xy.peV5C =  xy.peV5C + ob.peV5C;
        xy.peP5A =  xy.peP5A + ob.peP5A;
        xy.peP5N =  xy.peP5N + ob.peP5N;
        xy.peP5C =  xy.peP5C + ob.peP5C;
        xy.peVFA =  xy.peVFA + ob.peVFA;
        xy.peVFN =  xy.peVFN + ob.peVFN;
        xy.peVFC =  xy.peVFC + ob.peVFC;
        xy.pePFA =  xy.pePFA + ob.pePFA;
        xy.pePFN =  xy.pePFN + ob.pePFN;
        xy.pePFC =  xy.pePFC + ob.pePFC;
        xy.dia =  ob.dia;
      }
      var sendObj = JSON.parse(JSON.stringify(xy))
      xy.ppoAv = 0,
      xy.ppoNC = 0,
      xy.ppoVC = 0,
      xy.ppo90 = 0,
      xy.pprAv = 0,
      xy.pprNC = 0,
      xy.pprVC = 0,
      xy.ppr90 = 0,
      xy.pTtAv = 0,
      xy.pTtNC = 0,
      xy.pTtVC = 0,
      xy.pVRAv = 0,
      xy.pVRNC = 0,
      xy.pVRVC = 0,
      xy.pLLAA = 0,
      xy.peTAv = 0,
      xy.peTNC = 0,
      xy.peTVC = 0,
      xy.peTUR = 0,
      xy.petUP = 0,
      xy.peV5A = 0;//
      xy.peV5N = 0;//
      xy.peV5C = 0;
      xy.peP5A = 0;
      xy.peP5N = 0;
      xy.peP5C = 0;
      xy.peVFA = 0;
      xy.peVFN = 0;
      xy.peVFC = 0;
      xy.pePFA = 0;
      xy.pePFN = 0;
      xy.pePFC = 0;
      xy.dia = 0
      res.status(200).send(sendObj)
    }
  });
})

/* Carga de data Excel en BD. */
router.get('/manual', function(req, res, next) {
  cargarEnBd().catch(console.error);

  res.send('Enviando a BD');
});

async function cargarEnBd() {
  var bucketName= 'river-sonar-421523_cloudbuild';
  var fileName = 'data al 19.05.xlsx';
  // Downloads the file into a buffer in memory.
  const storage = new Storage({keyFilename: 'key.json'});
  var contents = await storage.bucket(bucketName).file(fileName).download();
  console.log('DEBUG: Se descargó xlsx')
  var wb = new ExcelJS.Workbook();
  await wb.xlsx.read(contents);
  contents = null
  console.log('DEBUG: Se leyó xlsx')
  con.query('TRUNCATE Data.ventasData', function (error, results, fields) {
    if (error) throw error;
    console.log('DEBUG: Se truncó tabla Data.ventasData')
    var fin = fileName.split('al ')[1].split('.')[0];
    const ws = wb.getWorksheet('Sheet1');
    try {
      console.log('DEBUG: Inicio de llenado de tabla Data.ventasData')
      ws.eachRow(function(row, rowNumber) {
        if (rowNumber > 3) {
          var codigo = row.findCell(1).text;
          var nombre = row.findCell(2).text;
          var clase = row.findCell(3) === undefined ? '' : row.findCell(3).text;
          var loc = row.findCell(4).text + ' - ' + row.findCell(12).text + ' - ' + row.findCell(13).text;
          var locEnt = row.findCell(11) === undefined ? row.findCell(5).text : (row.findCell(11).text + ' - ' + row.findCell(5).text);
          //Porta Origen Postpago X
          var ppoAv = + row.findCell(31).text;
          var ppoNC = + row.findCell(50).text;
          var ppoVC = ppoAv - ppoNC;
          var ppo90 = + row.findCell(63).text;
          //Porta Origen Postpago X
          var pprAv = + row.findCell(32).text;
          var pprNC = + row.findCell(49).text;
          var pprVC = pprAv - pprNC;
          var ppr90 = + row.findCell(43).text;
          //Postpago Total X
          var pTtAv = + row.findCell(39).text;
          var pTtNC = + row.findCell(51).text;
          var pTtVC = pTtAv - pTtNC;
          //Venta Regular X
          var pVRAv = pTtAv - ppoAv - pprAv;
          var pVRNC = pTtNC - ppoNC - pprNC;
          var pVRVC = pVRAv - pVRNC;
          var pLLAA = + row.findCell(34).text;
          //Prepago
          var peTAv = + row.findCell(22).text;
          var peTNC = + row.findCell(44).text;
          var peTVC = peTAv - peTNC;
          var peTUR = + row.findCell(33).text;
          //
          var petUP = peTAv > 0 ? peTUR / peTAv : 0;
          var peV5A = + row.findCell(28).text;//
          var peV5N = + row.findCell(47).text;//
          var peV5C = peV5A - peV5N;
          var peP5A = + row.findCell(23).text;
          var peP5N = + row.findCell(24).text;
          var peP5C = peP5A - peP5N;
          var peVFA = + row.findCell(27).text;
          var peVFN = + row.findCell(46).text;
          var peVFC = peVFA - peVFN;
          var pePFA = + row.findCell(25).text;
          var pePFN = + row.findCell(26).text;
          var pePFC = pePFA - pePFN;
          var dia = + row.findCell(18)
          
          con.query('INSERT INTO Data.ventasData ' +
          '(fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,'+
          'ppoVC,ppo90,pprAv,pprNC,pprVC,ppr90,pTtAv,pTtNC,pTtVC,pVRAv,'+
          'pVRNC,pVRVC,pLLAA,peTAv,peTNC,peTVC,peTUR,petUP,peV5A,peV5N,'+
          'peV5C,peP5A,peP5N,peP5C,peVFA,peVFN,peVFC,pePFA,pePFN,pePFC,dia) '+
          'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,
            ppoVC,ppo90,pprAv,pprNC,pprVC,ppr90,pTtAv,pTtNC,pTtVC,pVRAv,
            pVRNC,pVRVC,pLLAA,peTAv,peTNC,peTVC,peTUR,petUP,peV5A,peV5N,
            peV5C,peP5A,peP5N,peP5C,peVFA,peVFN,peVFC,pePFA,pePFN,pePFC,dia], function (error, results, fields) {
            if (error) throw error;
          });
        }
      });
      console.log("DEBUG: Enviado a DB")
    }
    catch (err) {
        console.log(err);
    }
  });
  
}

module.exports = {router,cargarEnBd}
