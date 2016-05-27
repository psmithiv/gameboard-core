/**
 * Created by psmit on 5/26/2016.
 */
exports = module.exports = init;

function init(config) {
    'use strict';

    var restify = inject('restify');
    var wifiService = inject('wifiService');

    /**
     * @private
     * @param req
     * @param res
     * @param next
     */
    var getNetworks = function (req, res, next) {
        var success = function(result) {
            res.send({networks: result});
        };

        var fail = function(error) {
            res.send({error: 'error'});
        };

        wifiService.getNetworks()
            .then(success, fail);
    };

    /**
     * @constructor
     */
    (function(){
        restify.get('/wifi/networks', getNetworks);
    }())
}