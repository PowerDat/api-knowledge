const db = require("./db");
const helper = require("../helper");

async function getOrganizationGroup() {
  const rows = await db.query(
    `SELECT organization_parent_id, 
            organization_code, 
            organization_name_th 
    FROM us_organization WHERE organization_parent_id = 0000`
  );
  const data = helper.emptyOrRows(rows);
  return data;
}

module.exports = {
  getOrganizationGroup,
};
