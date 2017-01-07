'use strict';

let expect = chai.expect;

describe('equivalency.filter', function() {
    beforeEach(module('core'));

    it('should handle general equivalencies', inject(function($filter) {
        let inputEquiv = [{
            "institution": "VCU",
            "type": "direct",
            "input": [ {
                "subject": "ACC",
                "number": "202",
                "credits": 3
            } ],
            "output": [ {
                "subject": "ACCT",
                "number": "202",
                "credits": {
                    "min": 3,
                    "max": 4
                }
            } ]
        }];

        let result = $filter('equivalency')(inputEquiv);
        expect(result.length).to.be.equal(1);
        expect(result[0].willTransfer).to.be.true;
        expect(result[0].input.length).to.be.equal(inputEquiv[0].input.length);
        expect(result[0].input[0]).to.be.an('object');
        expect(result[0].output.length).to.be.equal(inputEquiv[0].output.length);
        expect(result[0].input[0]).to.be.an('object');
    }));

    it('should pay attention to type:none', inject(function($filter) {
        let inputEquiv = [{
            "institution": "UVA",
            "type": "none",
            "output": [
                {
                    "subject": "NONE",
                    "number": "000",
                    "credits": 0
                }
            ]
        }];

        let result = $filter('equivalency')(inputEquiv);
        expect(result.length).to.be.equal(1);
        expect(result[0].willTransfer).to.be.false;
        expect(result[0].input).to.be.undefined;
        expect(result[0].output).to.be.undefined;
    }));

    it('should format input/output as strings when requested', inject(function($filter) {
        let inputEquiv = [{
            "institution": "VCU",
            "type": "direct",
            "input": [ {
                "subject": "ACC",
                "number": "202",
                "credits": 3
            } ],
            "output": [ {
                "subject": "ACCT",
                "number": "202",
                "credits": {
                    "min": 3,
                    "max": 4
                }
            } ]
        }];

        let result = $filter('equivalency')(inputEquiv, true);
        expect(result[0].input[0]).to.be.an('object')
        expect(result[0].output[0]).to.be.an('object')
    }));
})
