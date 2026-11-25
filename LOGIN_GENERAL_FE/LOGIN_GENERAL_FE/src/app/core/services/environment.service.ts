import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface IpValidationResult {
  isConsistent: boolean;
  apiHost: string | null;
  loginHost: string | null;
  message: string;
}

export interface ServerInfo {
  environmentName: string;
  apiUrl: string;
  apiHost: string | null;
  apiPort: string | null;
  loginUrl: string;
  loginHost: string | null;
  frontendRuntimeHost: string | null;
  frontendRuntimeIp: string | null;
  frontendTargetServer: string | null;
  isProduction: boolean;
  isDevServer: boolean;
  serverType: ServerType;
  generatedAt?: string;
}

type ServerType = 'development' | 'quality' | 'production' | 'local' | 'unknown';

interface KnownServer {
  ip: string;
  name: string;
  type: Exclude<ServerType, 'local' | 'unknown'>;
}

interface ExpectedHostsByServerType {
  expectedApiHost: string | null;
  expectedLoginHost: string | null;
  allowEmptyLogin: boolean;
}

interface EnvironmentMeta {
  environmentName?: string;
  server?: string;
  generatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private readonly knownServers: KnownServer[] = [
    { ip: '10.100.6.24', name: 'WIN-R0CQNKDBP24', type: 'development' },
    { ip: '10.100.6.19', name: 'HR1W19DESAPP01', type: 'quality' },
    { ip: '10.100.6.22', name: 'HR1W19DESINTR01', type: 'quality' },
    { ip: '172.16.3.90', name: 'HR1W19PROSAPP01', type: 'production' },
    { ip: '172.16.3.94', name: 'HR1W19PROINTR01', type: 'production' }
  ];

  logEnvironmentInfo(): void {
    const serverInfo = this.getServerInfo();
    const validation = this.validateIpConsistency();

    if (serverInfo.serverType === 'production' && validation.isConsistent) {
      return;
    }

    const lines = [
      `Environment : ${serverInfo.environmentName}`,
      `API URL     : ${serverInfo.apiUrl}`,
      `Login URL   : ${serverInfo.loginUrl || 'N/A'}`,
      `API Host    : ${serverInfo.apiHost || 'N/A'}`,
      `API Port    : ${serverInfo.apiPort || 'N/A'}`,
      `FE Host     : ${serverInfo.frontendRuntimeHost || 'N/A'}`,
      `Server Type : ${serverInfo.serverType.toUpperCase()}`
    ];

    console.log('%c[ENV] Runtime configuration', `color: ${this.getHeaderColor(serverInfo.serverType)}; font-weight: bold`);
    lines.forEach((line) => console.log(line));

    if (!validation.isConsistent) {
      console.warn('%c[ENV] Host matrix mismatch', 'color: #FF5722; font-weight: bold');
      console.warn(`API Host   : ${validation.apiHost}`);
      console.warn(`Login Host : ${validation.loginHost}`);
      console.warn(`Detail     : ${validation.message}`);
    } else if (
      validation.apiHost &&
      validation.loginHost &&
      validation.apiHost !== validation.loginHost &&
      (serverInfo.serverType === 'quality' || serverInfo.serverType === 'production')
    ) {
      console.info(
        `%c[ENV] Split-host validated: API=${validation.apiHost} / Login=${validation.loginHost}`,
        'color: #03A9F4; font-weight: bold'
      );
    }

    this.logServerTypeIndicator(serverInfo.serverType);

    if (serverInfo.generatedAt) {
      console.log(`[ENV] Generated: ${serverInfo.generatedAt}`);
    }
  }

  getServerInfo(): ServerInfo {
    const apiHost = this.getApiHost();
    const apiPort = this.getApiPort();
    const loginHost = this.getLoginHost();
    const frontendRuntimeHost = this.getFrontendRuntimeHost();
    const frontendRuntimeIp = this.getFrontendRuntimeIp();
    const frontendTargetServer = this.getFrontendTargetServer();
    const serverType = this.detectServerType(apiHost);

    return {
      environmentName: this.getEnvironmentName(),
      apiUrl: environment.url_api,
      apiHost,
      apiPort,
      loginUrl: this.getLoginUrl(),
      loginHost,
      frontendRuntimeHost,
      frontendRuntimeIp,
      frontendTargetServer,
      isProduction: environment.production,
      isDevServer: this.isDevServer(),
      serverType,
      generatedAt: this.getGeneratedAt()
    };
  }

  validateIpConsistency(): IpValidationResult {
    const apiHost = this.getApiHost();
    const loginHost = this.getLoginHost();
    const serverType = this.detectServerType(apiHost);
    const expected = this.getExpectedHostsByServerType(serverType);

    if (!apiHost) {
      return {
        isConsistent: false,
        apiHost,
        loginHost,
        message: 'Could not parse API URL'
      };
    }

    if (!loginHost) {
      return {
        isConsistent: expected.allowEmptyLogin,
        apiHost,
        loginHost,
        message: expected.allowEmptyLogin
          ? 'Single API mode accepted for this environment'
          : 'Login URL host is required for this environment'
      };
    }

    if (serverType === 'local') {
      const localHosts = ['localhost', '127.0.0.1'];
      const isConsistent = localHosts.includes(apiHost) && localHosts.includes(loginHost);
      return {
        isConsistent,
        apiHost,
        loginHost,
        message: isConsistent
          ? 'Local runtime hosts are consistent'
          : 'Local mode requires localhost or 127.0.0.1 for API and login'
      };
    }

    if (expected.expectedApiHost && expected.expectedLoginHost) {
      const isConsistent = apiHost === expected.expectedApiHost && loginHost === expected.expectedLoginHost;
      return {
        isConsistent,
        apiHost,
        loginHost,
        message: isConsistent
          ? 'Environment host matrix validated'
          : `Expected API(${expected.expectedApiHost}) and Login(${expected.expectedLoginHost})`
      };
    }

    const isConsistent = apiHost === loginHost;
    return {
      isConsistent,
      apiHost,
      loginHost,
      message: isConsistent
        ? 'All endpoints point to the same host'
        : `IP mismatch: API(${apiHost}) vs Login(${loginHost})`
    };
  }

  detectServerType(apiHost: string | null): ServerType {
    const envName = this.getEnvironmentName().toLowerCase();

    if (!apiHost) {
      if (envName.includes('qa') || envName.includes('quality') || envName.includes('calidad')) {
        return 'quality';
      }
      if (environment.production) {
        return 'production';
      }
      return 'unknown';
    }

    if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
      return 'local';
    }

    const knownServer = this.knownServers.find((server) => server.ip === apiHost);
    if (knownServer) {
      return knownServer.type;
    }

    if (envName.includes('qa') || envName.includes('quality') || envName.includes('calidad')) {
      return 'quality';
    }

    if (environment.production) {
      return 'production';
    }

    return 'unknown';
  }

  isDevServer(): boolean {
    if (!environment.production) {
      return true;
    }

    const serverType = this.detectServerType(this.getApiHost());
    return serverType === 'development' || serverType === 'local';
  }

  getApiHost(): string | null {
    try {
      return new URL(environment.url_api).hostname;
    } catch {
      return null;
    }
  }

  getApiPort(): string | null {
    try {
      return new URL(environment.url_api).port || null;
    } catch {
      return null;
    }
  }

  getLoginHost(): string | null {
    try {
      const loginUrl = this.getLoginUrl();
      if (!loginUrl) {
        return null;
      }
      return new URL(loginUrl).hostname;
    } catch {
      return null;
    }
  }

  getFrontendRuntimeHost(): string | null {
    if (typeof window === 'undefined' || !window.location) {
      return null;
    }

    return window.location.host || null;
  }

  getFrontendRuntimeIp(): string | null {
    const runtimeHost = this.getFrontendRuntimeHost();
    if (!runtimeHost) {
      return null;
    }

    const hostname = runtimeHost.split(':')[0];
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) ? hostname : null;
  }

  getFrontendTargetServer(): string | null {
    return this.getMeta().server || null;
  }

  getEnvironmentName(): string {
    return this.getMeta().environmentName || (environment.production ? 'Production' : 'Development');
  }

  getGeneratedAt(): string | undefined {
    return this.getMeta().generatedAt;
  }

  isKnownServer(): boolean {
    const apiHost = this.getApiHost();
    return apiHost ? this.knownServers.some((server) => server.ip === apiHost) : false;
  }

  getKnownServerInfo(): KnownServer | null {
    const apiHost = this.getApiHost();
    return this.knownServers.find((server) => server.ip === apiHost) || null;
  }

  private getExpectedHostsByServerType(serverType: ServerType): ExpectedHostsByServerType {
    switch (serverType) {
      case 'development':
        return {
          expectedApiHost: '10.100.6.24',
          expectedLoginHost: '10.100.6.24',
          allowEmptyLogin: false
        };
      case 'quality':
        return {
          expectedApiHost: '10.100.6.19',
          expectedLoginHost: '10.100.6.22',
          allowEmptyLogin: false
        };
      case 'production':
        return {
          expectedApiHost: '172.16.3.90',
          expectedLoginHost: '172.16.3.94',
          allowEmptyLogin: false
        };
      case 'local':
        return {
          expectedApiHost: 'localhost',
          expectedLoginHost: 'localhost',
          allowEmptyLogin: true
        };
      default:
        return {
          expectedApiHost: null,
          expectedLoginHost: null,
          allowEmptyLogin: false
        };
    }
  }

  private getLoginUrl(): string {
    return (environment as typeof environment & { url_login?: string }).url_login || '';
  }

  private getMeta(): EnvironmentMeta {
    return (environment as typeof environment & { _meta?: EnvironmentMeta })._meta || {};
  }

  private getHeaderColor(serverType: ServerType): string {
    switch (serverType) {
      case 'production':
        return '#E91E63';
      case 'quality':
        return '#9C27B0';
      case 'development':
        return '#4CAF50';
      case 'local':
        return '#FF9800';
      default:
        return '#607D8B';
    }
  }

  private logServerTypeIndicator(serverType: ServerType): void {
    switch (serverType) {
      case 'production':
        console.log('%c[ENV] PRODUCTION SERVER', 'color: #E91E63; font-weight: bold');
        break;
      case 'quality':
        console.log('%c[ENV] QUALITY SERVER', 'color: #9C27B0; font-weight: bold');
        break;
      case 'development':
        console.log('%c[ENV] DEVELOPMENT SERVER', 'color: #4CAF50; font-weight: bold');
        break;
      case 'local':
        console.log('%c[ENV] LOCAL DEVELOPMENT', 'color: #FF9800; font-weight: bold');
        break;
      default:
        console.log('%c[ENV] UNKNOWN SERVER TYPE', 'color: #607D8B; font-weight: bold');
    }
  }
}
