const db = require("./db");
const helper = require("../helper");

async function getOrganizationGroup() {
  const rows = await db.query(
    `SELECT organization_code AS value, 
            organization_name_th AS label
    FROM us_organization WHERE organization_parent_id = 0000`
  );
  const data = helper.emptyOrRows(rows);
  return data;
}

module.exports = {
  getOrganizationGroup,
};
