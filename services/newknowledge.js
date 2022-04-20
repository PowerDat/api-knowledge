const db = require("./db");
const helper = require("../helper");

//องค์ความรู้ใหม่
async function getnewknowledgegroup(paramsQuery) {
  const rows = await db.query(
    `SELECT progress_report.concept_proposal_id,progress_report.progress_report_id
        ,progress_report_knowledge_group.knowledge_group_category,progress_report_outcome_knowledge.outcome_knowledge_name
        ,progress_report_outcome_knowledge.outcome_knowledge_detail
        FROM progress_report_outcome_knowledge
        JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_outcome_knowledge.knowledge_group_id
        JOIN progress_report_knowledge ON progress_report_knowledge.knowledge_group_id = progress_report_knowledge_group.knowledge_group_id
        JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
        WHERE progress_report_knowledge_group.knowledge_group_category = "${paramsQuery.groupName}"
    `
  );

  const data = helper.emptyOrRows(rows);
  let concept_proposal_id = [];

  data.map((listvalue) => {
    concept_proposal_id.push(listvalue.concept_proposal_id);
  });

  let cciq = [...new Set(concept_proposal_id)];

  console.log(cciq);

  let output_innovations = [];
  let concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
              INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
        `
    );

    const data1 = helper.emptyOrRows(locations);
    data1.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.concept_proposal_name,
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
        project_type: listvalue.project_type_id,
      })
    );

    const innovations = await db.query(
      `SELECT * FROM progress_report_output INNER JOIN progress_report 
          ON progress_report.progress_report_id = progress_report_output.progress_report_id 
        WHERE progress_report.concept_proposal_id = ${cciq[i]}`
    );

    const data = helper.emptyOrRows(innovations);
    data.map((listvalue) => {
      output_innovations.push({
        output_id: listvalue.output_id,
        concept_proposal_id: listvalue.concept_proposal_id,
        progress_report_id: listvalue.progress_report_id,
        output_name: listvalue.output_name,
        output_detail: listvalue.output_detail,
      });
    });
  }

  const newlocation = helper.groupBy(
    concept_proposal_locations,
    "concept_proposal_id"
  );
  const conceptlocation = newlocation.map((val) => val.data[0]);
  const conceptid = conceptlocation.map((val) => val.concept_proposal_id);

  const co_locations = [];
  for (let i = 0; i < conceptid.length; i++) {
    const co_concept = await db.query(`
      SELECT 
        cp.project_type_id,
        cp.concept_proposal_name_th,
        ccf.concept_proposal_id, 
        cr.co_researcher_name_th, 
        cr.co_researcher_latitude, 
        cr.co_researcher_longitude, 
        cr.co_researcher_image
      FROM co_concept_fk ccf 
        INNER JOIN co_researcher cr 
      ON cr.co_researcher_id = ccf.co_researcher_id
        INNER JOIN concept_proposal cp
      ON cp.concept_proposal_id = ccf.concept_proposal_id
        WHERE ccf.concept_proposal_id = ${conceptid[i]}`);

    co_concept.map((val) =>
      co_locations.push({
        concept_proposal_id: val.concept_proposal_id,
        concept_proposal_name: val.co_researcher_name_th,
        concept_proposal_name_th: val.concept_proposal_name_th,
        lat: val.co_researcher_latitude,
        lon: val.co_researcher_longitude,
        project_type: val.project_type_id,
      })
    );
  }

  conceptlocation.map((val) => co_locations.push(val));
  console.log(co_locations);

  const results = co_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  const results_innovation = results.map((item) => {
    const arrayResult = output_innovations.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, Innovation: arrayResult };
  });

  const groupCencept = helper.groupBy(
    results_innovation,
    "concept_proposal_id"
  );
  groupCencept.map((v) => {
    if (
      v.data[0].new_knowledges.length >= 1 ||
      v.data[0].Innovation.length >= 1
    ) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.new_knowledges = [];
        item.Innovation = [];
      });
    }
  });

  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });

  const parentNodes = [];
  prepareNodes.map((listvalue, index) => {
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_id: listvalue.concept_proposal_id,
      concept_proposal_name: listvalue.concept_proposal_name,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,

      lat: listvalue.lat,
      lon: listvalue.lon,
      new_knowledges: listvalue.new_knowledges,
      knowledges: listvalue.knowledges,
      Innovation: listvalue.Innovation,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.new_knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      })
    )
  );

  const childinnovationNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.Innovation.map((item, index) =>
      childinnovationNodes.push({
        id: `${listvalue.id}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_name: item.output_detail,
        output_detail: item.output_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      })
    )
  );

  let newknowledgelink = [];

  parentNodes.map((listvalue) => {
    listvalue.new_knowledges.map((kn, id) => {
      listvalue.Innovation.map((inno, idx) => {
        newknowledgelink.push({
          from: `${listvalue.id}.${id + 1}`,
          to: `${listvalue.id}.${idx + 1}in`,
        });
      });
    });
  });

  const groupNodes = helper.groupBy(parentNodes, "concept_proposal_id");
  console.log("sss", groupNodes);

  let linkNode = [];
  const l = groupNodes.map((item) => {
    const linknode = item.data.map((link) => {
      return { from: link.id, to: link.id + 1 };
    });

    linknode.pop();

    // console.log("sssa", linknode[0]);
    if (linknode[0]) {
      let lastone = {
        from: linknode[0].from,
        to: linknode[linknode.length - 1].to,
      };
      linknode.push(lastone);
    }

    return { links: linknode };
  });

  l.map((item) => {
    // item.links.pop();
    item.links.map((list) => linkNode.push(list));
  });

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childinnovationNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, newknowledgelink);
  helper.applyArray(links, linkNode);

  return {
    nodes: parentNodes,
    links: links,
  };

  return parentNodes;
}

async function getCampusGroup(paramsQuery) {
  const rows = await db.query(
    `SELECT  cp.concept_proposal_id, 
                  cp.concept_proposal_name_th, 
                  cp.concept_proposal_name_en,
                  cp.project_type_id,
                  un.name
          FROM bb_user bu 
              INNER JOIN university_name un on bu.user_section = un.unid 
              INNER JOIN concept_proposal cp on cp.user_idcard = bu.user_idcard
          WHERE un.unid = "${paramsQuery.groupId}"
      `
  );

  const data = helper.emptyOrRows(rows);

  const concept_proposal_id = data.map(
    (listvalue) => listvalue.concept_proposal_id
  );

  let cciq = [...new Set(concept_proposal_id)];
  console.log(cciq);

  const university = await db.query(
    `SELECT * FROM university_name un WHERE un.unid = "${paramsQuery.groupId}"`
  );

  // console.log(data);

  // const results_university = university.map((item) => {
  //     const arrayResult = data.filter(
  //         (itemInArray) => itemInArray.name === item.name
  //     );
  //     return {...item, projects: arrayResult };
  // });

  // console.log(results_university);

  let knowledgedata = [],
    Innovationdata = [],
    newKnowledgeData = [];

  for (let i = 0; i < cciq.length; i++) {
    const knowledges = await db.query(
      `SELECT progress_report.progress_report_id,progress_report.concept_proposal_id,progress_report_knowledge.knowledge_name,progress_report_knowledge.knowledge_detail
      ,progress_report_knowledge_group.knowledge_group_category
      FROM progress_report_knowledge
      JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_knowledge.knowledge_group_id
      JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
      WHERE progress_report.concept_proposal_id = ${cciq[i]}
      `
    );
    knowledges.map((listvalue) => knowledgedata.push(listvalue));

    // จบตรงนี้1 อาเรย์
    // เตรียมข้อมูลออกมาเพื่อทำโหนด
    const Innovation = await db.query(
      `SELECT progress_report.concept_proposal_id,progress_report.progress_report_id,progress_report_output.output_name
      ,progress_report_output.output_detail
      FROM progress_report_output
      JOIN progress_report ON progress_report.progress_report_id = progress_report_output.progress_report_id
      
        WHERE progress_report.concept_proposal_id = ${cciq[i]}
        `
    );
    Innovation.map((listvalue) => Innovationdata.push(listvalue));

    const newKnowledge = await db.query(`
                SELECT pr.concept_proposal_id,
                    pr.project_id,
                    prok.outcome_knowledge_name, 
                    prok.outcome_knowledge_detail,
                    prok.outcome_knowledge_image,
                    prok.outcome_knowledge_video
            FROM progress_report_outcome AS pro 
                INNER JOIN progress_report_outcome_knowledge AS prok
            ON pro.outcome_id = prok.outcome_id
                INNER JOIN progress_report AS pr 
            ON pr.progress_report_id = pro.progress_report_id
            
            WHERE pr.concept_proposal_id = ${cciq[i]}
        `);
    newKnowledge.map((listvalue) => newKnowledgeData.push(listvalue));
  }

  // console.log(newKnowledgeData);

  const results_knowledges = data.map((item) => {
    const arrayResult = knowledgedata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, knowledges: arrayResult };
  });

  // console.log(resultsknowledge);

  const resultsinnovation = results_knowledges.map((item) => {
    const arrayResult = Innovationdata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, innovations: arrayResult };
  });

  // console.log(resultsinnovation);

  const resultsnewknowledge = resultsinnovation.map((item) => {
    const arrayResult = newKnowledgeData.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, newknowledges: arrayResult };
  });

  // console.log(resultsnewknowledge);

  // const prepareNodes = [];
  // groupCencept.map((listvalue, index) => {
  //     listvalue.data.map((item) => prepareNodes.push(item));
  // });

  const results_university = university.map((item) => {
    return {
      ...item,
      projects: resultsnewknowledge,
    };
  });

  //   console.log(results_university[0].projects)

  const parentNodes = [];

  results_university.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      university_name: listvalue.name,
      lat: listvalue.lat,
      lon: listvalue.lot,
      projects: listvalue.projects,
      img: "https://researcher.kims-rmuti.com/file-upload/researcher-upload/123.jpg",
    })
  );

  const childNodes = [];
  const linksNodes = [];
  parentNodes.map((listvalue) => {
    listvalue.projects.map((item, index) => {
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        concept_proposal_id: item.concept_proposal_id,
        concept_proposal_name_th: item.concept_proposal_name_th,
        type: "child",
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: `https://researcher.kims-rmuti.com/icon/${
          item.project_type_id == 1
            ? "วิจัย.png"
            : item.project_type_id == 2
            ? "บริการ.png"
            : "u2t.jpg"
        }`,
      });
      item.knowledges.map((d, i) => {
        linksNodes.push({
          from: `${listvalue.id}.${index + 1}`,
          to: `${index + 1}.${i + 1}kn`,
        });
      });
    });
  });

  console.log(linksNodes);

  const childNodeKnowledges = [];
  let knowledgeslink = [];

  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.knowledges.map((item, index) => {
      childNodeKnowledges.push({
        id: `${i + 1}.${index + 1}kn`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      });
      listvalue.innovations.map((inno, idx) => {
        knowledgeslink.push({
          from: `${i + 1}.${index + 1}kn`,
          to: `${i + 1}.${idx + 1}in`,
        });
      });
    });
  });
  //   console.log(childNodeKnowledges);
  //   console.log(knowledgeslink);

  const childinnovationNodes = [];
  let innovationslink = [];

  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.innovations.map((item, index) => {
      childinnovationNodes.push({
        id: `${i + 1}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_name: item.output_name,
        output_detail: item.output_detail,
        // concept_proposal_name_th: item.concept_proposal_name_th,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      });
      listvalue.newknowledges.map((nkn, idx) => {
        innovationslink.push({
          from: `${i + 1}.${index + 1}in`,
          to: `${i + 1}.${idx + 1}nkn`,
        });
      });
    });
  });
  //   console.log(innovationslink);

  const childNewknowledges = [];
  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.newknowledges.map((item, index) => {
      childNewknowledges.push({
        id: `${i + 1}.${index + 1}nkn`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        //   concept_proposal_name_th: item.concept_proposal_name_th,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/new%20knowledge3.png",
      });
    });
  });

  //   console.log(childNewknowledges);

  // let knowledgeslink = [];
  // let innovationslink = [];
  // let newknowledgeslink = [];

  // parentNodes.map((listvalue) => {
  //     listvalue.knowledges.map((kn, id) => {
  //         listvalue.innovation.map((inno, idx) => {
  //             knowledgeslink.push({
  //                 from: `${listvalue.id}.${id + 1}`,
  //                 to: `${listvalue.id}.${idx + 1}in`,
  //             });
  //         });
  //     });

  //     listvalue.innovations.map((kn, idn) => {
  //         listvalue.newknowledges.map((nkn, idnk) => {
  //             innovationslink.push({
  //                 from: `${listvalue.id}.${id + 1}in`,
  //                 to: `${listvalue.id}.${idx + 1}nkn`,
  //             });
  //         });

  //     });

  //     listvalue.newknowledges.map((nkn, idn) => {
  //         listvalue.projects.map((inno, idnk) => {
  //             newknowledgeslink.push({
  //                 from: `${listvalue.id}.${id + 1}nkn`,
  //                 to: `${listvalue.id}.${idx + 1}pj`,
  //             });
  //         });

  //     });

  // });
  // console.log(parentNodes);

  // const groupNodes = helper.groupBy(parentNodes, "concept_proposal_id");
  // console.log("sss", groupNodes);

  // let linkNode = [];
  // const l = groupNodes.map((item) => {
  //     const linknode = item.data.map((link) => {
  //         return { from: link.id, to: link.id + 1 };
  //     });

  //     linknode.pop();

  //     // console.log("sssa", linknode[0]);
  //     if (linknode[0]) {
  //         let lastone = {
  //             from: linknode[0].from,
  //             to: linknode[linknode.length - 1].to,
  //         };
  //         linknode.push(lastone);
  //     }

  //     return { links: linknode };
  // });

  // l.map((item) => {
  //     // item.links.pop();
  //     item.links.map((list) => linkNode.push(list));
  // });

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodeKnowledges);
  helper.applyArray(parentNodes, childinnovationNodes);
  helper.applyArray(parentNodes, childNewknowledges);

  // helper.applyArray(parentNodes, childNodenewknowledges);

  parentNodes.map((v) => delete v.projects);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksNodes);
  helper.applyArray(links, knowledgeslink);
  helper.applyArray(links, innovationslink);

  return {
    nodes: parentNodes,
    links: links,
  };
}

module.exports = {
  getnewknowledgegroup,
  getCampusGroup,
};
