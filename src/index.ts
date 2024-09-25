import axios, { AxiosProgressEvent, AxiosResponse } from "axios";

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
    headers?: HeadersInit;
    data?: any;
}

export type BaseConfig = BaseOptions & Events

export interface Config extends BaseConfig {
    method: Methods;
}

const PointFetch = (options: Config) => {
    const URL = options.baseURL ? options.baseURL + options.endPoint : options.url;
    typeof options.onStart === 'function' && options.onStart();
    const axiosHeaders: Record<string, any> = {};
    if (options.headers && options.headers instanceof Headers) {
        const headers = options.headers;
        headers.forEach((value, key) => {
            axiosHeaders[key] = value
        })
    }
    axios({
        url: URL,
        headers: axiosHeaders,
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

const get = (options: BaseConfig) => PointFetch({ method: 'get', ...options, });
const post = (options: BaseConfig) => PointFetch({ method: 'post', ...options });
const put = (options: BaseConfig) => PointFetch({ method: 'put', ...options });
const patch = (options: BaseConfig) => PointFetch({ method: 'patch', ...options });
const destroy = (options: BaseConfig) => PointFetch({ method: 'delete', ...options });

export default PointFetch;

export {
    get,
    post,
    put,
    patch,
    destroy
}