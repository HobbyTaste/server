import chai from "chai";
import "mocha";
import chaiHttp from "chai-http";
import shell from "shelljs";

import Hobby from "../models/hobby";
import { IHobby } from "../types/hobby";
import hobbies from "../fixtures/hobbies.json";
import providers from "../fixtures/providers.json";
import other_data from "./data/other.json";
import * as utils from "./utils";
import { HTTP_STATUS } from "./utils";

const assert: Chai.AssertStatic = chai.assert;
chai.use(chaiHttp);

describe("Work with hobbies", function() {
    this.slow(300);

    before(() => {
        shell.exec("node tasks/fixtures.js >/dev/null");
    });

    after(async () => {
        await utils.logout_user();
        await utils.logout_provider();
    })

    it("should get a list of all hobbies", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/hobby/all")
            .set("csrf-token", process.env.csrfToken || "");
        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        assert.lengthOf(res.body, hobbies.length, "The number of hobbies is too big or too small, not right");
        const database_hobbies: IHobby[] = await Hobby.find();
        const handled_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(res.body);
        const database_handled_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(database_hobbies);
        assert.sameDeepMembers<Partial<IHobby>>(
            handled_hobbies,
            database_handled_hobbies,
            "Hobbies are not what was expected"
        );
    });

    it("should filter hobbies by category", async () => {
        await utils.filter_test({ category: "sport" });
    });

    it("should filter hobbies by metroId", async () => {
        await utils.filter_test({ metroId: "136" });
    });

    it("should get information about hobby by id", async () => {
        const { price, metroStation, monetization, ...truncated_hobby } = utils.unify_hobby_list([hobbies[0]])[0];
        const chosen_hobby: IHobby | null = await Hobby.findOne(truncated_hobby);
        if (!chosen_hobby) {
            assert.fail("Hobby id was not found in database");
        }
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/hobby/info")
            .query({ id: chosen_hobby?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "");

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const response_hobby: Partial<IHobby> = utils.unify_hobby_list([res.body])[0];
        const database_hobby: Partial<IHobby> = utils.unify_hobby_list([chosen_hobby])[0];
        assert.deepEqual(response_hobby, database_hobby, "Hobby is not what was expected");
    });

    it("should not update hobby info without provider", async () => {
        const { price, metroStation, monetization, ...truncated_hobby } = utils.unify_hobby_list([hobbies[2]])[0];
        let chosen_hobby: IHobby | null = await Hobby.findOne(truncated_hobby);
        const res_with_token: ChaiHttp.Response = await utils.agent
            .post("/restapi/hobby/edit")
            .query({ id: chosen_hobby?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "")
            .send(other_data.hobby_update);

        assert.equal(res_with_token.status, HTTP_STATUS.UNAUTHORIZED, "Status code is not 401");
        process.env.csrfToken = res_with_token.header["csrf-token"];
        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/hobby/edit")
            .query({ id: chosen_hobby?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "")
            .send(other_data.hobby_update);

        assert.equal(
            res.status,
            HTTP_STATUS.FORBIDDEN,
            "Незалогиненный пользователь не получил ошибку авторизации при попытке редактирования хобби"
        );
        assert.include(res.text, "Партнёр не авторизован", "Неверное сообщение об ошибке");
    });

    it("should not update hobby info with wrong provider", async () => {
        // Владелец — 0-й провайдер, не 1-й
        await utils.login_provider(providers[1].email, providers[1].password);

        const { price, metroStation, monetization, ...truncated_hobby } = utils.unify_hobby_list([hobbies[2]])[0];
        let chosen_hobby: IHobby | null = await Hobby.findOne(truncated_hobby);
        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/hobby/edit")
            .query({ id: chosen_hobby?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "")
            .send(other_data.hobby_update);

        assert.equal(res.status, HTTP_STATUS.FORBIDDEN, "Провайдеру удалось отредактировать чужое хобби");
        assert.include(res.text, "Нельзя редактировать чужие хобби", "Неверное сообщение об ошибке");

        await utils.logout_provider();
    });

    it("should update information about hobby by id", async () => {
        await utils.login_provider(providers[0].email, providers[0].password);

        const { price, metroStation, monetization, ...truncated_hobby } = utils.unify_hobby_list([hobbies[2]])[0];
        let chosen_hobby: IHobby | null = await Hobby.findOne(truncated_hobby);

        await utils.agent
            .post("/restapi/hobby/edit")
            .query({ id: chosen_hobby?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "")
            .send(other_data.hobby_update);

        let { phone, ...rest_props } = truncated_hobby;
        chosen_hobby = await Hobby.findOne(rest_props);
        assert.equal(other_data.hobby_update.phone, chosen_hobby?.phone);

        await utils.logout_provider();
    });

    it("should find hobby by label", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/hobby/find")
            .query({ label: "футбол" })
            .set("csrf-token", process.env.csrfToken || "");

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const database_hobbies = utils.unify_hobby_list([
            hobbies[0],
            { ...hobbies[2], phone: other_data.hobby_update.phone },
        ]);
        const response_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(res.body);
        assert.sameDeepMembers<Partial<IHobby>>(response_hobbies, database_hobbies, "Found wrong hobbies");
    });

    it("should find hobby by label and metroId", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/hobby/find")
            .query({ label: "футбол", metroId: "136" })
            .set("csrf-token", process.env.csrfToken || "");

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const database_hobbies: Partial<IHobby>[] = utils.unify_hobby_list([hobbies[0]]);
        const response_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(res.body);
        assert.deepEqual<Partial<IHobby>>(response_hobbies, database_hobbies, "Found wrong hobbies");
    });
});
