import axios, { AxiosHeaders, AxiosProgressEvent, AxiosResponse } from "axios";

export type Methods = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface BaseEvents {
    onStart?: () => void;
    onSuccess?: (res: AxiosResponse) => void;
    onError?: (err: any, res: AxiosResponse) => void;
    onFinish?: () => void;
    signal?: AbortSignal
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export interface ErrorEvents {
    onServerError?: (res: AxiosResponse) => void;
    onUnAuthenticated?: (res: AxiosResponse) => void;
    onForbidden?: (res: AxiosResponse) => void;
}

export type Events = BaseEvents & ErrorEvents;

export interface BaseOptions {
    baseURL?: string;
    endPoint?: string;
    url?: string;
    data?: any;
    authorization?: string;
}

export type BaseConfig = BaseOptions & Events

export interface Config extends BaseConfig {
    method: Methods;
}

const Fetch = (options: Config) => {
    options.onStart && options.onStart();
    const headers = new AxiosHeaders();
    headers.set('Accept', 'application/json');
    if (options.method !== 'get') {
        headers.set('Content-Type', 'application/json');
    }
    if (options.authorization) {
        headers.set('Authorization', options.authorization)
    }
    axios({
        baseURL: options.baseURL,
        url: options.url ?? options.endPoint,
        headers: headers,
        method: options.method,
        data: JSON.stringify(options.data),
        signal: options.signal,
        onUploadProgress: (e) => options.onUploadProgress && options.onUploadProgress(e),
        onDownloadProgress: (e) => options.onDownloadProgress && options.onDownloadProgress(e)
    })
        .then((res) => options.onSuccess && options.onSuccess(res))
        .catch((err) => {
            if (err.response) {
                options.onError && options.onError(err.response.data.error, err.response);
                (options.onServerError && err.response.status === 500) && options.onServerError(err.response);
                (options.onUnAuthenticated && err.response.status === 401) && options.onUnAuthenticated(err.response);
                (options.onForbidden && err.response.status === 403) && options.onForbidden(err.response);
            } else {
                throw new Error(err);
            }
        })
        .finally(() => options.onFinish && options.onFinish())
}

const get = (options: BaseConfig) => Fetch({ method: 'get', ...options, });
const post = (options: BaseConfig) => Fetch({ method: 'post', ...options });
const put = (options: BaseConfig) => Fetch({ method: 'put', ...options });
const patch = (options: BaseConfig) => Fetch({ method: 'patch', ...options });
const destroy = (options: BaseConfig) => Fetch({ method: 'delete', ...options });

export default Fetch;

export {
    get,
    post,
    put,
    patch,
    destroy
}
