require('dotenv').config();

class Environment {

  constructor() { this.loadEnvironment(); }

  writeToConsole(message) {
    if (process.env.NODE_ENV !== 'testing') {
      console.log(message);
    }
  }

  loadEnvironment() {
    this.writeToConsole('=== Environment Variables ===\n');
    // Global
    this.NODE_ENV = this.loadVariable('NODE_ENV');
    this.CWD = process.cwd();
    this.writeToConsole(`  CWD: ${this.CWD}`);
    this.PORT = this.loadVariable('PORT');
    this.HOST = this.loadVariableOrDefault('HOST', '0.0.0.0');

    this.LOG_LEVEL = this.loadVariableOrDefault('LOG_LEVEL', 'http');

    if (this.NODE_ENV === 'development') {
      this.loadDevelopmentEnvironment();
    } else {
      this.loadProductionEnvironment();
    }

    this.writeToConsole('\n=============================\n');
  };

  loadDevelopmentEnvironment() {
    this.writeToConsole('\n--- Development Variables ---');

    // Add development only variables here
  }

  loadProductionEnvironment() {
    this.writeToConsole('\n--- Production Variables ---');

    // Add production only variables here
  }

  loadVariable(name) {
    const value = process.env[name];

    if (!value) {
      this.writeToConsole(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    this.writeToConsole(`  ${name}: ${value}`);
    return value;
  }

  loadSecretVariable(name) {
    const value = process.env[name];

    if (!value) {
      this.writeToConsole(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    this.writeToConsole(`  ${name}: set`);
    return value;
  }

  loadOptionalVariable(name) {
    const value = process.env[name];

    if (!value) {
        this.writeToConsole(`  ${name}: [optional variable not set]`);
        return '';
    }

    this.writeToConsole(`  ${name}: ${value}`);
    return value;
  }

  loadVariableOrDefault(name, alt = ''){
    const value = process.env[name] || alt;

    this.writeToConsole(`  ${name}: ${value}`);
    return value;
  }

  checkSecretVariable(name) {
      const value = process.env[name];

      if (!value) {
          console.error(`  !! ERROR !! - Required variable of "${name}" is not set!`);
          process.exit(400);
      }
      this.writeToConsole(`  ${name}: SET`);
  }
}

module.exports = new Environment();