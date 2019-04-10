var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;

module.exports = require('../models')('CommentPeriod', {
    additionalText       : { type: String, default: '' },
    ceaaAdditionalText   : { type: String, default: '' },
    ceaaInformationLabel : { type: String, default: '' },
    ceaaRelatedDocuments : { type: String, default: '' },
    classificationRoles  : [{ type: String, default: '' }],
    classifiedPercent    : { type: Number, default: '' },
    commenterRoles       : [{ type: String, default: '' }],
    dateAdded            : { type: String, default: '' },
    dateCompleted        : { type: String, default: '' },
    dateCompletedEst     : { type: String, default: '' },
    dateStarted          : { type: String, default: '' },
    dateStartedEst       : { type: String, default: '' },
    dateUpdated          : { type: String, default: '' },
    downloadRoles        : [{ type: String, default: '' }],
    informationLabel     : { type: String, default: '' },
    instructions         : { type: String, default: '' },
    isClassified         : { type: Boolean, default: '' },
    isPublished          : { type: Boolean, default: '' },
    isResolved           : { type: Boolean, default: '' },
    isVetted             : { type: String, default: '' },
    milestone            : { type: 'ObjectId', ref: 'Milestone', default: null, index: true },
    openHouses           : [{ type: Mixed, default: {} }],
    periodType           : { type: String, default: '' },
    phase                : { type: String, default: '' },
    phaseName            : { type: String, default: '' },
    project              : { type: 'ObjectId', ref: 'Project', default: null, index: true },
    publishedPercent     : { type: Number, default: '' },
    rangeOption          : { type: String, default: '' },
    rangeType            : { type: String, default: '' },
    relatedDocuments     : { type: String, default: '' },
    resolvedPercent      : { type: Number, default: '' },
    userCan              : { type: String, default: '' },
    vettedPercent        : { type: Number, default: '' },
    vettingRoles         : [{ type: String, default: '' }],

    // Permissions
    read                : [{ type: String, trim: true, default: 'sysadmin' }],
    write               : [{ type: String, trim: true, default: 'sysadmin' }],
    delete              : [{ type: String, trim: true, default: 'sysadmin' }]
}, 'epic');