import {HTTP_STATUS, IHTTPError} from "../types/http";

export default (error: IHTTPError | object) => {
    if ("status" in error && "message" in error) {
        return {
            status: error.status,
            message: error.message
        }
    } else {
        return {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error
        }
    }
}
