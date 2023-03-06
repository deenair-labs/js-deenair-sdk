import * as mockttp from 'mockttp';
import { isPromise } from 'util/types';

export const MOCK_PORT = 8989;

export const mockServer: mockttp.Mockttp | undefined = mockttp.getLocal();

export type MockRpcResponse = {
  method: string;
  params: Array<any> | object;
  result?: Promise<any> | any;
  error?: any;
};

export const mockErrorMessage = 'Invalid';
export const mockErrorResponse = {
  code: -32602,
  message: mockErrorMessage,
};

export class MockRpcNode {
  private mockServer: mockttp.Mockttp;
  constructor(mockServer: mockttp.Mockttp) {
    this.mockServer = mockServer;
  }

  mockRpcResponse = async (response: MockRpcResponse) => {
    const { method, params, result, error } = response;
    if (!this.mockServer) return;
    await this.mockServer.stop();
    await this.mockServer.start(MOCK_PORT);
    await this.mockServer
      .forPost('/')
      .withJsonBodyIncluding({
        jsonrpc: '2.0',
        method,
        params,
      })
      .thenCallback(async () => {
        try {
          const unwrappedResult = isPromise(result) ? await result : result;
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '',
              error,
              result: unwrappedResult,
            },
          };
        } catch (error) {
          return { statusCode: 500 };
        }
      });
  };
}
