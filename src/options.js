const Path = require('path');

const INDENT = 2;

class Option {
  constructor(props) {
    Object.assign(this, props);
    this.type = this.type ?? 'boolean';
    console.assert((this.shortOpt ?? !this.longOpt),
		   'must have either shortOpt or longOpt', props);
  }

  summary() {
    let text = '';
    const arg = this.arg ? ` ${this.arg}` : '';
    if (this.shortOpt) text += `-${this.shortOpt}${arg}`;
    if (this.shortOpt && this.longOpt) text += ' | ';
    if (this.longOpt) text += `--${this.longOpt}${arg}`;
    return text;
  }

  help() {
    let text = ' '.repeat(INDENT) + this.summary();
    if (this.doc) {
      text += '\n' + ' '.repeat(INDENT*2) + this.doc;
    }
    return text;
  }

  toString() {
    return this.longOpt ? `--${this.longOpt}` : `-${this.shortOpt}`;
  }

}

class Options {
  constructor(options) {
    
    this._optionSpecs = options;
    this._shortOptions = Object.fromEntries(
      Object.entries(options).
	filter(([k, v]) => v.shortOpt).
	map(([opt, v]) => [ v.shortOpt, Object.assign({}, v, {opt}) ])
    );
    this._longOptions = Object.fromEntries(
      Object.entries(options).
	filter(([k, v]) => v.longOpt).
	map(([opt, v]) => [ v.longOpt, Object.assign({}, v, {opt}) ])
    );
    this.options = {};
  }

  addOptionArgs(args=process.argv.slice(2), errors=[]) {
    const options = {};
    let i;
    for (i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (arg.length < 2) {
	break;
      }
      else if (arg === '--') {
	i++; break;
      }
      else if (arg.startsWith('--')) {
	i += this._addLongOption(args, i, options, errors);
      }
      else if (arg.startsWith('-')) {
	i += this._addShortOption(args, i, options, errors);
      }
      else {
	break;
      }
    }
    Object.assign(this.options, options);
    return args.slice(i);
  }

  helpText() {
    let text = '';
    for (const option of Object.values(this._optionSpecs)) {
      text += option.help() + "\n";
    }
    return text;
  }

  _assignOption(optInfo, options, value) {
    const { opt, isMultiple } = optInfo;
    if (isMultiple) {
      if (!options[opt]) {
	options[opt] = [ value ];
      }
      else {
	options[opt].push(value);
      }
    }
    else {    
      options[opt] = value;
    }
  }

  _addShortOption(args, argsIndex, options, errors) {
    const arg = args[argsIndex].slice(1);
    for (let i = 0; i < arg.length; ++i) {
      const c = arg[i];
      const opt = this._shortOptions[c];
      if (!opt) {
	errors.push(`unknown option ${c} in option -${arg}`);
	return 0;
      }
      else if (opt.arg) {
	if (i < arg.length - 1) {
	  this._assignOption(opt, options, arg.slice(i + 1));
	  return 0;
	}
	else if (argsIndex < args.length - 1) {
	  this._assignOption(opt, options, args[argsIndex + 1]);
	  return 1;
	}
	else {
	  errors.push(`option -${c} requires an argument`);
	  return 0;
	}
      }
      else {
	options[opt.opt] = true;
      }
    }
    return 0;    
  }

  _addLongOption(args, argsIndex, options, errors) {
    const arg = args[argsIndex];
    const opt = this._longOptions[arg.slice(2)];
    if (!opt) {
      errors.push(`unknown option ${arg}`);
      return 0;
    }
    else if (opt.arg) {
      if (argsIndex < args.length - 1) {
	this._assignOption(opt, options, args[argsIndex + 1]);
	return 1;
      }
      else {
	errors.push(`option ${arg} requires an argument`);
	return 0;
      }
    }
    else {
      options[opt.opt] = true;
      return 0;
    }
  }

}

module.exports = { Option, Options };

