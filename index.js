// Generated by CoffeeScript 1.10.0
(function() {
  var VariableScopeRule;

  module.exports = VariableScopeRule = (function() {
    function VariableScopeRule() {}

    VariableScopeRule.prototype.rule = {
      name: 'variable_scope',
      level: 'warn',
      message: 'Outer scope variable overwrite',
      description: 'To never overwrite outer scope variable by accident',
      scopeDiff: 1
    };

    VariableScopeRule.prototype.lintAST = function(node, astApi) {
      var config, error, errors, i, len;
      config = astApi.config[this.rule.name];
      errors = this.lintNode(node, {}, this.scopeDiffFilter(config.scopeDiff));
      for (i = 0, len = errors.length; i < len; i++) {
        error = errors[i];
        this.errors.push(astApi.createError({
          context: error.variable,
          lineNumber: error.upper.locationData.first_line + 1,
          lineNumberEnd: error.lower.locationData.first_line + 1
        }));
      }
      return false;
    };

    VariableScopeRule.prototype.scopeDiffFilter = function(diff) {
      return function(lower, upper) {
        return lower.scope_level - upper.scope_level >= diff;
      };
    };

    VariableScopeRule.prototype.lintNode = function(node, upperAssigns, filter, level) {
      var assign, assignArr, assigns, code, codes, errors, i, j, len, len1, name, upper;
      if (level == null) {
        level = 1;
      }
      filter = filter || function() {
        return true;
      };
      errors = [];
      codes = this.nodeCodes(node);
      assigns = this.nodeAssigns(node);
      for (name in assigns) {
        assignArr = assigns[name];
        for (i = 0, len = assignArr.length; i < len; i++) {
          assign = assignArr[i];
          assign.scope_level = level;
        }
      }
      for (name in upperAssigns) {
        upper = upperAssigns[name];
        if (name in assigns && filter(assigns[name][0], upper)) {
          errors.push({
            variable: name,
            upper: upper,
            lower: assigns[name][0]
          });
        } else {
          assigns[name] = upper;
        }
      }
      for (name in assigns) {
        assignArr = assigns[name];
        if (Array.isArray(assignArr)) {
          assigns[name] = assignArr[assignArr.length - 1];
        }
      }
      for (j = 0, len1 = codes.length; j < len1; j++) {
        code = codes[j];
        errors = errors.concat(this.lintNode(code.body, assigns, filter, level + 1));
      }
      return errors;
    };

    VariableScopeRule.prototype.nodeCodes = function(node) {
      var codes;
      codes = [];
      node.traverseChildren(false, (function(_this) {
        return function(child) {
          if (child.constructor.name === 'Code') {
            return codes.push(child);
          }
        };
      })(this));
      return codes;
    };

    VariableScopeRule.prototype.nodeAssigns = function(node) {
      var assigns, ignoreNext;
      assigns = {};
      ignoreNext = false;
      node.traverseChildren(false, (function(_this) {
        return function(child) {
          var base, i, len, name, results, v, variables;
          switch (child.constructor.name) {
            case 'Assign':
              if (child.variable.properties.length) {
                return;
              }
              if (child.context === 'object') {
                return;
              }
              if (ignoreNext) {
                return ignoreNext = false;
              }
              variables = !!child.variable.base.objects ? child.variable.base.objects : [child.variable];
              results = [];
              for (i = 0, len = variables.length; i < len; i++) {
                v = variables[i];
                base = v.name ? v.name.base : v.value ? v.value.base : v.base;
                name = base.value;
                if (!assigns[name]) {
                  assigns[name] = [];
                }
                results.push(assigns[name].push(child));
              }
              return results;
              break;
            case 'Comment':
              if (child.comment.match(/coffeelint-variable-scope-ignore/)) {
                return ignoreNext = true;
              }
          }
        };
      })(this));
      return assigns;
    };

    return VariableScopeRule;

  })();

}).call(this);
