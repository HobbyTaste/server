import chai from "chai";
import "mocha";
import chaiHttp from "chai-http";

import server from "../app";
import { Hobby, User, Provider, Comment } from "../models";
import { IProvider } from "../types/provider";
import { IUser } from "../types/user";
import { IHobby, TariffPlans } from "../types/hobby";
import { hobby_props } from "./data/other.json";
import { ICommentInfo } from "../types/comment";
import { HTTP_STATUS } from "../types/http";

const assert: Chai.AssertStatic = chai.assert;
chai.use(chaiHttp);

export let agent: ChaiHttp.Agent = chai.request.agent(server);

export async function create_provider(provider: Partial<IProvider>): Promise<void> {
    const res_with_token: ChaiHttp.Response = await agent.post("/restapi/provider/create").send(provider);

    assert.equal(res_with_token.status, HTTP_STATUS.UNAUTHORIZED, "Status code is not 401");
    process.env.csrfToken = res_with_token.header["csrf-token"];
    const res: ChaiHttp.Response = await agent
        .post("/restapi/provider/create")
        .set("csrf-token", process.env.csrfToken || "")
        .send(provider);

    assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
    const providers = await Provider.find({ phone: provider.phone });
    assert.lengthOf(providers, 1, "Many or no providers, expected 1");
}

export async function logout_provider(): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .get("/restapi/provider/logout")
        .set("csrf-token", process.env.csrfToken || "");
    assert.equal(res.status, HTTP_STATUS.OK, "Logout failed");
}

export async function login_provider(email: string | undefined, password: string | undefined): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .post("/restapi/provider/login")
        .set("csrf-token", process.env.csrfToken || "")
        .send({ email: email, password: password });
    assert.equal(res.status, HTTP_STATUS.OK, "Email and password checking failed");
}

export async function add_hobby(hobby: Partial<IHobby>): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .post("/restapi/hobby/add")
        .set("csrf-token", process.env.csrfToken || "")
        .send(hobby);
    assert.equal(res.status, HTTP_STATUS.OK, "Hobby was not added to database");
    const { owner, monetization, ...rest_props } = hobby;
    const hobbies = await Hobby.find(rest_props);
    assert.lengthOf(hobbies, 1, "Many or no hobbies, expected 1");
}

export function unify_hobby_list(hobby_list: any[]): Partial<IHobby>[] {
    return hobby_list.map((hobby) => {
        const result: any = {};
        for (const key of hobby_props) {
            switch (key) {
                case "contacts":
                    // Object.fromEntries, похоже, увы, пока не реализован в TypeScript.
                    if (hobby[key] instanceof Map) {
                        result[key] = {};
                        for (const [map_key, map_value] of hobby[key]) {
                            result[key][map_key] = map_value;
                        }
                    } else {
                        result[key] = hobby[key];
                    }
                    break;
                case "price":
                    result[key] = {
                        title: hobby[key]?.title.toString(),
                        priceList: hobby[key].priceList,
                    };
                    break;
                case "monetization":
                    result[key] = hobby[key].map((plan: any) => ({
                        tariff: plan.tariff,
                        activationDate: plan.activationDate,
                        expirationDate: plan.expirationDate,
                        cost: plan.cost,
                    }));
                    break;
                default:
                    result[key] = hobby[key];
            }
        }
        return result;
    });
}

export async function filter_test(filter: Partial<IHobby>): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .get("/restapi/hobby/filter")
        .query(filter)
        .set("csrf-token", process.env.csrfToken || "");

    assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
    const hobbies = await Hobby.find(filter);
    const handled_hobbies: Partial<IHobby>[] = unify_hobby_list(res.body);
    const database_handled_hobbies: Partial<IHobby>[] = unify_hobby_list(hobbies);
    assert.sameDeepMembers<Partial<IHobby>>(
        handled_hobbies,
        database_handled_hobbies,
        "Hobbies are not what was expected"
    );
}

export async function create_user(user: Partial<IUser>): Promise<void> {
    const res_with_token: ChaiHttp.Response = await agent.post("/restapi/user/create").send(user);

    assert.equal(res_with_token.status, HTTP_STATUS.UNAUTHORIZED, "Status code is not 401");
    process.env.csrfToken = res_with_token.header["csrf-token"];
    const res: ChaiHttp.Response = await agent
        .post("/restapi/user/create")
        .set("csrf-token", process.env.csrfToken || "")
        .send(user);

    assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
    const users = await User.find({ email: user.email });
    assert.lengthOf(users, 1, "Many or no users, expected 1");
}

export async function login_user(email: string | undefined, password: string | undefined): Promise<void> {
    let res: ChaiHttp.Response = await agent
        .post("/restapi/user/login")
        .set("csrf-token", process.env.csrfToken || "")
        .send({ email, password });
    assert.equal(res.status, HTTP_STATUS.OK, "Email and password checking failed");
}

export async function logout_user(): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .get("/restapi/user/logout")
        .set("csrf-token", process.env.csrfToken || "");

    assert.equal(res.status, HTTP_STATUS.OK, "Logout failed");
}

export async function subscribe(hobby: any): Promise<void> {
    const { price, monetization, metroStation, ...rest_props } = unify_hobby_list([hobby])[0];
    const database_hobby = await Hobby.findOne(rest_props);
    const res: ChaiHttp.Response = await agent
        .get("/restapi/user/subscribe")
        .query({ id: database_hobby?._id.toHexString() })
        .set("csrf-token", process.env.csrfToken || "");
    assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
}

export async function check_subscription(hobby: any, id: string): Promise<void> {
    const { price, monetization, metroStation, ...rest_props } = unify_hobby_list([hobby])[0];
    const database_hobby = await Hobby.findOne(rest_props);
    const subscribers_ids = database_hobby?.subscribers.map((subscriber: any) => subscriber.toHexString());
    assert.include(subscribers_ids, [id], "Can't see current user as a subsciber");
}

export async function add_comment(comment: Partial<ICommentInfo>, hobbyId: string, relatedId?: string): Promise<void> {
    const res: ChaiHttp.Response = await agent
        .post("/restapi/comment/create")
        .query({ hobbyId, relatedId })
        .set("csrf-token", process.env.csrfToken || "")
        .send(comment);
    assert.equal(res.status, HTTP_STATUS.OK, "Comment was not added to database");
    const comments = await Comment.find(comment);
    assert.lengthOf(comments, 1, "Many or no comments, expected 1");
}

export function check_comments_props(result: ICommentInfo[], ...comments: any[][]) {
    result.forEach((comment_info, index) => {
        assert.equal(comment_info.text, comments[index][0].text, `Text at comment ${index} is wrong`);
        assert.equal(
            comment_info.datetime,
            comments[index][0].datetime,
            `Datetime string at comment ${index} is wrong`
        );
        assert.equal(comment_info.evaluation, comments[index][0].evaluation, `Evaluation at comment ${index} is wrong`);
        if (comments[index].length === 2) {
            assert.equal(
                comment_info.answer?.text,
                comments[index][1].text,
                `Text at answer to comment ${index} is wrong`
            );
            assert.equal(
                comment_info.answer?.datetime,
                comments[index][1].datetime,
                `Datetime string at answer to comment ${index} is wrong`
            );
        }
    });
}
