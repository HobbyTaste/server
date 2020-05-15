import chai from "chai";
import "mocha";
import chaiHttp from "chai-http";
import shell from "shelljs";

import { Hobby, Provider } from "../models";
import { IHobby } from "../types/hobby";
import { IProvider } from "../types/provider";
import providers from "./data/providers.json";
import hobbies from "./data/hobbies.json";
import other_data from "./data/other.json";
import * as utils from "./utils";
import { HTTP_STATUS } from "../types/http";

const assert: Chai.AssertStatic = chai.assert;
chai.use(chaiHttp);

describe("Work with provider and add hobby", function() {
    this.slow(300);

    before(() => {
        shell.exec("node tasks/fixtures.js >/dev/null");
    });

    it("should create provider", async () => {
        await utils.create_provider(providers[0]);
    });

    it("should logout provider", async () => {
        await utils.logout_provider();
    });

    it("should not create provider due to non-unique email", async () => {
        const changed_provider = {
            ...providers[0],
            name: providers[0].name + "A",
            phone: providers[0].phone.slice(-1) + ((Number(providers[0].phone[-1]) + 1) % 10).toString(),
        };

        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/provider/create")
            .set("csrf-token", process.env.csrfToken || "")
            .send(changed_provider);
        assert.equal(res.status, HTTP_STATUS.BAD_REQUEST, "Checking email uniqueness failed");
    });

    it("should not create provider due to non-unique phone", async () => {
        const changed_provider = {
            ...providers[0],
            name: providers[0].name + "A",
            email: "a" + providers[0].email
        };

        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/provider/create")
            .set("csrf-token", process.env.csrfToken || "")
            .send(changed_provider);
        assert.equal(res.status, HTTP_STATUS.BAD_REQUEST, "Checking phone uniqueness failed");
    });

    it("should not create provider due to non-unique name", async () => {
        const changed_provider = {
            ...providers[0],
            phone: providers[0].phone.slice(-1) + ((Number(providers[0].phone[-1]) + 1) % 10).toString(),
            email: "a" + providers[0].email
        };

        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/provider/create")
            .set("csrf-token", process.env.csrfToken || "")
            .send(changed_provider);
        assert.equal(res.status, HTTP_STATUS.BAD_REQUEST, "Checking name uniqueness failed");
    });

    it("should create another provider", async () => {
        await utils.create_provider(providers[1]);
    });

    it("should logout from another provider", async () => {
        await utils.logout_provider();
    });

    it("should not add hobbies for unauthorized provider", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/hobby/add")
            .set("csrf-token", process.env.csrfToken || "")
            .send(hobbies[0]);
        assert.equal(res.status, HTTP_STATUS.FORBIDDEN, "Unauthorized provider added hobby");
    });

    it("should login provider", async () => {
        await utils.login_provider(providers[0].email, providers[0].password);
    });

    it("successful login for already logged in provider", async () => {
        await utils.login_provider(providers[0].email, providers[0].password);
    });

    it("should add hobbies", async () => {
        await Promise.all(hobbies.map(utils.add_hobby));
    });

    it("should get info about current (logged in) provider", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/provider/info")
            .set("csrf-token", process.env.csrfToken || "");

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const { password, ...data_rest_props } = providers[0];
        const { id, __v, ...rest_props } = res.body;
        assert.deepEqual<Partial<IProvider>>(rest_props, data_rest_props, "Wrong info about provider");
    });

    it("should get info about other (not logged in) provider", async () => {
        const provider = await Provider.findOne({ phone: providers[1].phone });
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/provider/info")
            .query({ id: provider?._id.toHexString() })
            .set("csrf-token", process.env.csrfToken || "");

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const { password, ...data_rest_props } = providers[1];
        const { _id, __v, password: _, ...rest_props } = res.body._doc;
        assert.deepEqual<Partial<IProvider>>(rest_props, data_rest_props, "Wrong info about other provider");
    });

    it("should not get info about provider due to incorrect id", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/provider/info")
            .set("csrf-token", process.env.csrfToken || "")
            .query({ id: other_data.wrong_hex_string });

        assert.equal(res.status, HTTP_STATUS.NOT_FOUND, "Status code is not 404, found something wrong");
        assert.include(res.text, "Не найден такой пользователь");
    });

    it("should fail to edit provider data, because new data is not unique", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/provider/edit")
            .set("csrf-token", process.env.csrfToken || "")
            .send({ email: providers[1].email });

        assert.equal(res.status, HTTP_STATUS.BAD_REQUEST, "There are 2 equal emails in the database");
    });

    it("should edit provider data", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .post("/restapi/provider/edit")
            .set("csrf-token", process.env.csrfToken || "")
            .send(other_data.provider_update_info);

        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const provider = await Provider.findOne({ email: providers[0].email });
        if (!provider) {
            assert.fail("Updated provider was not found in database");
        }
        const rest_props = {
            phone: provider.phone,
            info: provider.info,
            name: provider.name,
        };
        let { password, ...data_props } = other_data.provider_update_info;
        assert.deepEqual<Partial<IProvider>>(rest_props, data_props, "Information was not updated correctly");
    });

    it("should find provider's hobbies", async () => {
        const res: ChaiHttp.Response = await utils.agent
            .get("/restapi/provider/hobbies")
            .set("csrf-token", process.env.csrfToken || "");
        assert.equal(res.status, HTTP_STATUS.OK, "Status code is not 200");
        const handled_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(res.body);
        const provider = await Provider.findOne({ email: providers[0].email });
        const database_hobbies = await Hobby.find({ owner: provider?._id });
        const database_handled_hobbies: Partial<IHobby>[] = utils.unify_hobby_list(database_hobbies);
        assert.sameDeepMembers<Partial<IHobby>>(
            handled_hobbies,
            database_handled_hobbies,
            "Hobbies are not what was expected"
        );
    });

    it("should login provider with updated password", async () => {
        await utils.logout_provider();
        await utils.login_provider(providers[0].email, other_data.provider_update_info.password);
        await utils.logout_provider();
    });
});
