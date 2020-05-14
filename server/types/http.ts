export enum HTTP_STATUS {
    INTERNAL_ERROR = 500,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    OK = 200,
}

export interface HTTPError {
    status: number,
    message: string
}
