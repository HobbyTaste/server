import {HTTP_STATUS, HTTPError} from "../types/http";

export default (error: HTTPError | object) => {
    if ("status" in error && "message" in error) {
        return {
            status: error.status,
            message: error.message
        }
    } else {
        return {
            status: HTTP_STATUS.INTERNAL_ERROR,
            message: error
        }
    }
}
