const db = require("./db");
const helper = require("../helper");

function generateRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var randomColor = generateRandomColor(); //"#F10531"

async function getNewKnowledgeGraph(groupName) {
  if (groupName == "knowledge") {
    const rows = await db.query(
      `SELECT COUNT(prk.knowledge_id) count, prkg.knowledge_group_category FROM progress_report_knowledge prk 
      inner join progress_report_knowledge_group prkg on prkg.knowledge_group_id = prk.knowledge_group_id
      group by prkg.knowledge_group_category`
    );
    const data = helper.emptyOrRows(rows);

    const labels = data.map((item) => item.knowledge_group_category);
    const datas = data.map((item, i) => item.count);
    const bgcolor = datas.map((item, i) => generateRandomColor());

    return {
      labels: labels,
      datasets: [
        {
          label: "Knowledge",
          data: datas,
          backgroundColor: bgcolor,
     
          borderWidth: 1,
        },
      ],
    };
  }
}

module.exports = {
  getNewKnowledgeGraph,
};
