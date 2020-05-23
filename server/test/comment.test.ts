import chai from "chai";
import "mocha";
import chaiHttp from "chai-http";
import shell from "shelljs";

import { Hobby, Comment } from "../models";
import { ICommentInfo } from "../types/comment";
import comments from "../fixtures/comments.json";
import data_comments from "./data/comments.json";
import providers from "../fixtures/providers.json";
import hobbies from "../fixtures/hobbies/development.json";
import users from "../fixtures/users.json";
import other_data from "./data/other.json";
import * as utils from "./utils";
import { HTTP_STATUS } from "../types/http";

const assert: Chai.AssertStatic = chai.assert;
chai.use(chaiHttp);

describe("Work with comments", function() {
    this.slow(500);

    before(() => {
        shell.exec("node tasks/fixtures.js >/dev/null");
    });

    after(() => {
        process.env.csrfToken = "";
    });

    it("should add comments from user", async () => {
        const res_with_token: ChaiHttp.Response = await utils.agent
            .post("/restapi/user/login")
            .send({ email: users[0].email, password: users[0].password });
        process.env.csrfToken = res_with_token.header["csrf-token"];

        await utils.login_user(users[0].email, users[0].password);
        const hobby = await Hobby.findOne({
            label: hobbies[1].label,
            phone: hobbies[1].phone,
            email: hobbies[1].email,
        });
        for (let i = 0; i < 3; i++) {
            await utils.add_comment(data_comments[i], hobby?._id.toHexString());
        }
        await utils.logout_user();
    });

    it("should add answers from provider", async () => {
        await utils.login_provider(providers[0].email, providers[0].password);
        const hobby = await Hobby.findOne({
            label: hobbies[1].label,
            phone: hobbies[1].phone,
            email: hobbies[1].email,
        });
        const comment = await Comment.findOne(data_comments[0]);
        await utils.add_comment(data_comments[3], hobby?._id.toHexString(), comment?._id.toHexString());
        await utils.logout_provider();
    });

    it("should get comments for user", async () => {
        await utils.login_user(users[0].email, users[0].password);
        const res = await utils.agent.get("/restapi/user/comments").set("csrf-token", process.env.csrfToken || "");
        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        assert.lengthOf(res.body, 4, "The number of comments is too big or too small, not right");
        utils.check_comments_props(
            res.body,
            [comments[0], comments[1]],
            [data_comments[0], data_comments[3]],
            [data_comments[1]],
            [data_comments[2]]
        );
        await utils.logout_user();
    });

    it("should get comments for provider", async () => {
        await utils.login_provider(providers[1].email, providers[1].password);
        const res = await utils.agent.get("/restapi/provider/comments").set("csrf-token", process.env.csrfToken || "");
        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        assert.lengthOf(res.body.commentsInfo, 4, "The number of comments is too big or too small, not right");
        assert.lengthOf(res.body.commentsIds, 4, "The number of commentsIds is too big or too small, not right");
        utils.check_comments_props(
            res.body.commentsInfo,
            [comments[2]],
            [data_comments[0], data_comments[3]],
            [data_comments[1]],
            [data_comments[2]]
        );
        await utils.logout_provider();
    });
});
