"use strict";
var Operators;
(function (Operators) {
    Operators[Operators["Unknown"] = 0] = "Unknown";
    Operators[Operators["EqualTo"] = 1] = "EqualTo";
    Operators[Operators["LessThan"] = 2] = "LessThan";
    Operators[Operators["GreaterThan"] = 3] = "GreaterThan";
    Operators[Operators["Range"] = 4] = "Range";
})(Operators = exports.Operators || (exports.Operators = {}));
var QueryExpression = (function () {
    function QueryExpression(queryParams) {
        this.params = {};
        this.mapping = null;
        for (var prop in queryParams) {
            var paramInfo = QueryExpression.getParamInfo(prop);
            var clause = this.getClause(paramInfo[0]);
            if (clause != null) {
                if (clause.operator != paramInfo[1]) {
                    if (clause.operator == Operators.LessThan) {
                        clause.valueUpper = clause.value;
                        clause.value = queryParams[prop];
                    }
                    else {
                        clause.valueUpper = queryParams[prop];
                    }
                    clause.operator = Operators.Range;
                }
            }
            else {
                this.params[paramInfo[0].toLowerCase()] = {
                    operator: paramInfo[1],
                    value: queryParams[prop]
                };
            }
        }
    }
    QueryExpression.prototype.getClause = function (paramName) {
        return this.params[paramName.toLowerCase()];
    };
    QueryExpression.prototype.isAny = function () {
        if (this.mapping != null) {
            for (var prop in this.mapping) {
                if (this.getClause(prop) != null) {
                    return true;
                }
            }
            return false;
        }
        return Object.keys(this.params).length > 0;
    };
    QueryExpression.prototype.getSqlFilterPredicates = function () {
        var _this = this;
        var predicates = Object.keys(this.mapping).map(function (prop) {
            var clause = _this.getClause(prop);
            if (clause != null) {
                var comparitor = "";
                switch (clause.operator) {
                    case Operators.EqualTo:
                        comparitor = "=";
                        break;
                    case Operators.GreaterThan:
                        comparitor = ">";
                        break;
                    case Operators.LessThan:
                        comparitor = "<";
                        break;
                    case Operators.Range:
                        return _this.mapping[prop].sqlName + " > @" + prop + "Low AND " +
                            _this.mapping[prop].sqlName + " < @" + prop + "Hi";
                }
                if (comparitor != "") {
                    return _this.mapping[prop].sqlName + " " + comparitor + " @" + prop;
                }
            }
            return "";
        });
        return predicates
            .filter(function (clause) { return clause != ""; })
            .join(" AND ");
    };
    QueryExpression.prototype.addRequestParameters = function (request) {
        for (var prop in this.mapping) {
            var clause = this.getClause(prop);
            if (clause != null) {
                if (clause.operator == Operators.Range) {
                    request.addParameter(prop + "Low", this.mapping[prop].dataType, clause.value);
                    request.addParameter(prop + "Hi", this.mapping[prop].dataType, clause.valueUpper);
                }
                else {
                    request.addParameter(prop, this.mapping[prop].dataType, clause.value);
                }
            }
        }
    };
    QueryExpression.getParamInfo = function (paramName) {
        var retval = QueryExpression.checkParamInfo(paramName, QueryExpression._suffix_gt, Operators.GreaterThan);
        if (retval[1] != Operators.Unknown) {
            return retval;
        }
        retval = QueryExpression.checkParamInfo(paramName, QueryExpression._suffix_lt, Operators.LessThan);
        if (retval[1] != Operators.Unknown) {
            return retval;
        }
        return [paramName, Operators.EqualTo];
    };
    QueryExpression.checkParamInfo = function (paramName, suffixCheck, operator) {
        var checkName = paramName.toLowerCase();
        var suffixIndex = checkName.lastIndexOf(suffixCheck);
        if (suffixIndex == checkName.length - suffixCheck.length) {
            return [paramName.substr(0, suffixIndex), operator];
        }
        return [paramName, Operators.Unknown];
    };
    return QueryExpression;
}());
QueryExpression._suffix_gt = "_gt";
QueryExpression._suffix_lt = "_lt";
exports.QueryExpression = QueryExpression;
//# sourceMappingURL=query_expression.js.map