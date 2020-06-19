const os = require('os');

const isNumber = (value) => {
  return isNaN(value) ? 0 : value;
}

const getCPUSpecs = () => {
  const osOutput = os.cpus();

  const arch = [];
  const avgTimes = {};

  osOutput.forEach( cpu => {
    if (!arch.includes(cpu.model)) {
      arch.push(cpu.model);
    }

    avgTimes.user = isNumber(avgTimes.user) + cpu.times.user;
    avgTimes.nice = isNumber(avgTimes.nice) + cpu.times.nice;
    avgTimes.sys = isNumber(avgTimes.sys) + cpu.times.sys;
    avgTimes.idle = isNumber(avgTimes.idle) + cpu.times.idle;
  });

  avgTimes.user = getTimeSince(((avgTimes.user / osOutput.length)));
  avgTimes.nice = getTimeSince(avgTimes.nice / osOutput.length);
  avgTimes.sys = getTimeSince(avgTimes.sys / osOutput.length);
  avgTimes.idle = getTimeSince(avgTimes.idle / osOutput.length);

  return {
    arch,
    times: avgTimes
  }
}

const getTimeSince = (date) => {
  const singularOrPlural = (value) => {
    return value === 1 ? '' : 's';
  } 
  
  let diff = date;
  const days = Math.floor( diff / (1000 * 60 * 60 * 24 ));
  diff -=  days * (1000 * 60 * 60 * 24);
  const hours = Math.floor( diff / (1000 * 60 * 60 ));
  diff -= hours * (1000 * 60 * 60);
  const mins = Math.floor( diff / (1000 * 60) );
  diff -= mins * (1000 * 60);
  const secs = Math.floor( diff / 1000 );
  diff -= secs * (1000);

  if (days > 0) {
      return `${days} day${singularOrPlural(days)}`;
  } else if (hours > 0) {
      return `${hours} hour${singularOrPlural(hours)}`;
  } else if (mins > 0) {
      return `${mins} minute${singularOrPlural(mins)}`;
  } else if (secs > 0) {
      return `${secs} second${singularOrPlural(secs)}`;
  }

  return `Some time ago`;
}

const getOSInfo = () => {
  const freemem = os.freemem();
  const totalmem = os.totalmem();

  const memusage = parseFloat(((totalmem - freemem) / totalmem) * 100).toFixed(2);

  const server_uptime = Math.floor(process.uptime()) * 1000;
  const system_uptime = os.uptime() * 1000

  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    server_uptime: getTimeSince(server_uptime),
    system_uptime: getTimeSince(system_uptime),
    memory: {
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      memory_usage: `${memusage}%`
    },
    cpu: getCPUSpecs()
  }
}

const getOSData = () => {
  return { d: '' }
}

module.exports = (app) => {
  app.socket_service.register('/status', async () => {
    return getOSInfo();
  });

  app.socket_service.register('/status/history', async () => {
    return getOSData();
  });
}