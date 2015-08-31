'use strict';

var fs = require('fs');
var Docker = require('dockerode');
var seneca = require('seneca')();

var exposedServices = require('./config.js').exposed;
var getServiceNumber = require('./config.js').getServiceNumber;

//console.log(getServiceNumber);

var environmentType;
fs.stat('/.dockerinit', function (err, stats) {
  if (err) {
    environmentType = 'local_dev';
  } else {
    environmentType = 'container';
  }
  // initial run
  runAtIntervals();
});

//every 15 seconds
setInterval(runAtIntervals, 15*1000);

var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

var services = [];

function Service(name, address, id) {
  this.name = name;
  this.address = address;
  this.id = id;
}

function runAtIntervals() {
  services = [];
  if (environmentType === 'container') {
    //we're in a container, need full service discovery
    serviceDiscovery();
  } else {
    //we're running locally, generate the service list ourselves
    ['Server', 'Directory', 'Make Post', 'Get Thread', 'Get Layout',
    'Get Threadlist', null, null, null, 'Get News'].forEach(function (item) {
      services.push(new Service(item, '127.0.0.1', null));
    })
    generateServiceList();
  }
}

function pushUpdates(list, containerId) {
  //console.log('PUSHUPDATES CALLED with containerid:', containerId, 'and this list:', list);
  var hostPort;
  if (containerId === 0) {
    hostPort = 10199;
  } else {
    hostPort = '1010' + containerId;
  }
  var hostIp = '127.0.0.1';
  if (services[containerId] !== undefined) {
    hostIp = services[containerId].address;
  }
  if (services[containerId] !== undefined && list.length > 0) {
    //send stuff
    seneca.client({host: hostIp, port: hostPort, pin:{cmd: 'config'}});
    console.log(hostIp, hostPort, list);
    seneca.act({cmd: 'config', data: list}, function (err, response) {
      if (err) {
        console.log(err);
      } else {
        //console.log(response);
      }
    })
  }


  //var stringLol = 'Need to send to ' + containerId;
  //if (list.length > 0) {
  //  stringLol += '@' + hostIp + ', port: ' + hostPort;
  //  stringLol += ' the following: ';
  //  stringLol += list;
  //} else {
  //  stringLol = 'Skipping this one, nothing to send';
  //}
  //if (services[containerId] !== undefined && list.length > 0) {
  //  stringLol += 'Sending This one!';
  //} else {
  //  stringLol += 'Skipping this one, it\'s offline or there\'s nothing to send';
  //}
  //console.log(stringLol);

}

function generateServiceList () {
  for (var key in exposedServices) {
    var serviceList = [];
    exposedServices[key].forEach(function (serviceNumber) {
      if (services[serviceNumber] === undefined) {
        serviceList.push('Offline');
      } else {
        serviceList.push(services[serviceNumber]);
      }
    });
    pushUpdates(serviceList, Number(key));
  }
}

function serviceDiscovery() {
  var stats  = fs.statSync(socket);

  if (!stats.isSocket() && environmentType === 'container') {
    throw new Error('FATAL: Docker not found ..');
  }

  var docker = new Docker({ socketPath: socket });

  var doneCount = 0;
  docker.listContainers({all: false}, function (err, containers) {
    containers.forEach(function (container) {
      docker.getContainer(container.Id).inspect(function (err, data) {
        data.Config.Env.forEach(function (envValue,y) {
          var thisLine = JSON.parse(JSON.stringify(envValue.split('=')));
          if (thisLine[0] === 'ZASBB_FUNCTION' && thisLine.length === 2) {
            var serviceNumber = getServiceNumber(thisLine[1]);
            services[serviceNumber] = new Service(thisLine[1], data.NetworkSettings.IPAddress, container.Id);
          }
          if (y === data.Config.Env.length -1) {
            doneCount++;
          }
          if (doneCount === containers.length) {
            generateServiceList();
          }
        });
      });
    });
  });
}
