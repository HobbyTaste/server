export enum HTTP_STATUS {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    OK = 200,
}

export interface IHTTPError {
    status: number,
    message: string
}
