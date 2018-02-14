var auth        = require("../helpers/auth");
var _           = require('lodash');
var defaultLog  = require('winston').loggers.get('default');
var mongoose    = require('mongoose');
var Actions     = require('../helpers/actions');
var Utils       = require('../helpers/utils');

exports.protectedOptions = function (args, res, rest) {
  res.status(200).send();
}

exports.publicGet = function (args, res, next) {
  // Build match query if on appId route
  var query = {};
  if (args.swagger.params.appId) {
    query = Utils.buildQuery("_id", args.swagger.params.appId.value, query);
  }
  _.assignIn(query, { isDeleted: false });

  getApplications(['public'], query, args.swagger.params.fields.value)
  .then(function (data) {
    return Actions.sendResponse(res, 200, data);
  });
};
exports.protectedGet = function(args, res, next) {
  var self        = this;
  self.scopes     = args.swagger.params.auth_payload.scopes;

  var Application = mongoose.model('Application');

  defaultLog.info("args.swagger.params:", args.swagger.params.auth_payload.scopes);

  // Build match query if on appId route
  var query = {};
  if (args.swagger.params.appId) {
    query = Utils.buildQuery("_id", args.swagger.params.appId.value, query);
  }
  // Unless they specifically ask for it, hide deleted results.
  if (args.swagger.params.isDeleted) {
    _.assignIn(query, { isDeleted: args.swagger.params.isDeleted.value });
  } else {
    _.assignIn(query, { isDeleted: false });
  }

  getApplications(args.swagger.params.auth_payload.scopes, query, args.swagger.params.fields.value)
  .then(function (data) {
    return Actions.sendResponse(res, 200, data);
  });
};

exports.protectedDelete = function (args, res, next) {
  var appId = args.swagger.params.appId.value;
  defaultLog.info("Delete Application:", appId);

  var Application = mongoose.model('Application');
  Application.findOne({_id: appId}, function (err, o) {
    if (o) {
      defaultLog.info("o:", o);

      // Set the deleted flag.
      Actions.delete(o)
      .then(function (deleted) {
        // Deleted successfully
        return Actions.sendResponse(res, 200, deleted);
      }, function (err) {
        // Error
        return Actions.sendResponse(res, 400, err);
      });
    } else {
      defaultLog.info("Couldn't find that object!");
      return Actions.sendResponse(res, 404, {});
    }
  });
}

//  Create a new application
exports.protectedPost = function (args, res, next) {
  var obj = args.swagger.params.app.value;
  defaultLog.info("Incoming new object:", obj);

  var Application = mongoose.model('Application');
  var app = new Application(obj);
  // Define security tag defaults
  app.tags = [['sysadmin']];
  app._addedBy = args.swagger.params.auth_payload.userID;
  app.save()
  .then(function (a) {
    // defaultLog.info("Saved new application object:", a);
    return Actions.sendResponse(res, 200, a);
  });
};

// Update an existing application
exports.protectedPut = function (args, res, next) {
  var objId = args.swagger.params.appId.value;
  defaultLog.info("ObjectID:", args.swagger.params.appId.value);

  var obj = args.swagger.params.AppObject.value;
  // Strip security tags - these will not be updated on this route.
  delete obj.tags;
  defaultLog.info("Incoming updated object:", obj);
  // TODO sanitize/update audits.

  var Application = require('mongoose').model('Application');
  Application.findOneAndUpdate({_id: objId}, obj, {upsert:false, new: true}, function (err, o) {
    if (o) {
      defaultLog.info("o:", o);
      return Actions.sendResponse(res, 200, o);
    } else {
      defaultLog.info("Couldn't find that object!");
      return Actions.sendResponse(res, 404, {});
    }
  });
}

// Publish/Unpublish the application
exports.protectedPublish = function (args, res, next) {
  var objId = args.swagger.params.appId.value;
  defaultLog.info("Publish Application:", objId);

  var Application = require('mongoose').model('Application');
  Application.findOne({_id: objId}, function (err, o) {
    if (o) {
      defaultLog.info("o:", o);

      // Add public to the tag of this obj.
      Actions.publish(o)
      .then(function (published) {
        // Published successfully
        return Actions.sendResponse(res, 200, published);
      }, function (err) {
        // Error
        return Actions.sendResponse(res, err.code, err);
      });
    } else {
      defaultLog.info("Couldn't find that object!");
      return Actions.sendResponse(res, 404, {});
    }
  });
};
exports.protectedUnPublish = function (args, res, next) {
  var objId = args.swagger.params.appId.value;
  defaultLog.info("UnPublish Application:", objId);

  var Application = require('mongoose').model('Application');
  Application.findOne({_id: objId}, function (err, o) {
    if (o) {
      defaultLog.info("o:", o);

      // Remove public to the tag of this obj.
      Actions.unPublish(o)
      .then(function (unpublished) {
        // UnPublished successfully
        return Actions.sendResponse(res, 200, unpublished);
      }, function (err) {
        // Error
        return Actions.sendResponse(res, err.code, err);
      });
    } else {
      defaultLog.info("Couldn't find that object!");
      return Actions.sendResponse(res, 404, {});
    }
  });
};
var getApplications = function (role, query, fields) {
  return new Promise(function (resolve, reject) {
    var Application = mongoose.model('Application');
    var projection = {};

    // Fields we always return
    var defaultFields = ['_id',
                        'code',
                        'tags'];
    _.each(defaultFields, function (f) {
        projection[f] = 1;
    });

    // Add requested fields - sanitize first by including only those that we can/want to return
    var sanitizedFields = _.remove(fields, function (f) {
      return (_.indexOf(['name',
                        'type',
                        'subtype',
                        'purpose',
                        'subpurpose',
                        '_proponent',
                        'latitude',
                        'longitude',
                        'areaHectares',
                        'location',
                        'region',
                        'description',
                        'legalDescription',
                        'status',
                        'projectDate',
                        'businessUnit',
                        'cl_files',
                        'stageCode',
                        'commodityType',
                        'commodity',
                        'commodities'], f) !== -1);
    });
    _.each(sanitizedFields, function (f) {
      projection[f] = 1;
    });

    Application.aggregate([
      {
        "$match": query
      },
      {
        "$project": projection
      },
      {
        $redact: {
         $cond: {
            if: {
              $anyElementTrue: {
                    $map: {
                      input: "$tags" ,
                      as: "fieldTag",
                      in: { $setIsSubset: [ "$$fieldTag", role ] }
                    }
                  }
                },
              then: "$$DESCEND",
              else: "$$PRUNE"
            }
          }
        }
    ]).exec()
    .then(function (data) {
      defaultLog.info("data:", data);
      resolve(data);
    });
  });
};