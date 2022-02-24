const db = require("./db");
const helper = require("../helper");



// เป้าหมายเพื่อการพัฒนา
async function getGoal(paramsQuery) {
    const rows = await db.query(`SELECT * FROM bd_sum_goal`);
    const data = helper.emptyOrRows(rows);

    const goals = [];
    data.map((listvalue) => {
        paramsQuery.goal_id == 1 ?
            listvalue.bcg_id ?
            goals.push(listvalue) : [] :
            paramsQuery.goal_id == 2 ?
            listvalue.sdgs_id ?
            goals.push(listvalue) : [] :
            paramsQuery.goal_id == 3 ?
            listvalue.curve_id ?
            goals.push(listvalue) : [] :
            paramsQuery.goal_id == 4 ?
            listvalue.cluster_id ?
            goals.push(listvalue) : [] : [];
    });

    function getUniqueListBy(arr, key) {
        return [...new Map(arr.map((item) => [item[key], item])).values()];
    }

    const newListGoal = getUniqueListBy(goals, "concept_proposal_id");

    const bcg_array = [];
    if (paramsQuery.goal_id == 1) {
        const bcg = newListGoal.map((list) => {
            return {
                bcg_id: list.bcg_id,
                concept_proposal_id: list.concept_proposal_id,
            };
        });
        for (let i = 0; i < bcg.length; i++) {
            for (let j = 0; j < JSON.parse(bcg[i].bcg_id).length; j++) {
                const rows = await db.query(
                    `SELECT * FROM bd_bcg where bcg_id = ${JSON.parse(bcg[i].bcg_id)[j]}`
                );
                const data = helper.emptyOrRows(rows);
                data.map((item) =>
                    bcg_array.push({
                        concept_proposal_id: Number(bcg[i].concept_proposal_id),
                        bcg_name: item.bcg_name,
                        img: item.bcg_image,
                    })
                );
            }
        }
    }
    // console.log(bcg_array);

    const sdgs_array = [];
    if (paramsQuery.goal_id == 2) {
        const sdgs = newListGoal.map((list) => {
            return {
                sdgs_id: list.sdgs_id,
                concept_proposal_id: list.concept_proposal_id,
            };
        });
        for (let i = 0; i < sdgs.length; i++) {
            for (let j = 0; j < JSON.parse(sdgs[i].sdgs_id).length; j++) {
                const rows = await db.query(
                    `SELECT * FROM bd_sdgs where sdgs_id = ${JSON.parse(sdgs[i].sdgs_id)[j]
                    }`
                );
                const data = helper.emptyOrRows(rows);
                data.map((item) =>
                    sdgs_array.push({
                        concept_proposal_id: Number(sdgs[i].concept_proposal_id),
                        sdgs_name: item.sdgs_name,
                        img: item.sdgs_image,
                    })
                );
            }
        }
    }
    // console.log(sdgs_array);

    const curve_array = [];
    if (paramsQuery.goal_id == 3) {
        const curve = newListGoal.map((list) => {
            return {
                curve_id: list.curve_id,
                concept_proposal_id: list.concept_proposal_id,
            };
        });
        for (let i = 0; i < curve.length; i++) {
            for (let j = 0; j < JSON.parse(curve[i].curve_id).length; j++) {
                const rows = await db.query(
                    `SELECT * FROM bd_10s_curve where curve_id = ${JSON.parse(curve[i].curve_id)[j]
                    }`
                );
                const data = helper.emptyOrRows(rows);
                data.map((item) =>
                    curve_array.push({
                        concept_proposal_id: Number(curve[i].concept_proposal_id),
                        curve_name: item.curve_name,
                        img: item.curve_image,
                    })
                );
            }
        }
    }
    // console.log(curve_array);

    const cluster_array = [];
    if (paramsQuery.goal_id == 4) {
        const cluster = newListGoal.map((list) => {
            return {
                cluster_id: list.cluster_id,
                concept_proposal_id: list.concept_proposal_id,
            };
        });
        for (let i = 0; i < cluster.length; i++) {
            for (let j = 0; j < JSON.parse(cluster[i].cluster_id).length; j++) {
                const rows = await db.query(
                    `SELECT * FROM bd_cluster where cluster_id = ${JSON.parse(cluster[i].cluster_id)[j]
                    }`
                );
                const data = helper.emptyOrRows(rows);
                data.map((item) =>
                    cluster_array.push({
                        concept_proposal_id: Number(cluster[i].concept_proposal_id),
                        cluster_name: item.cluster_name,
                        img: item.cluster_image,
                    })
                );
            }
        }
    }
    // console.log(cluster_array);

    const progress_report_id = newListGoal.map((list) => list.progress_report_id);
    const concept_proposal_id = newListGoal.map(
        (list) => list.concept_proposal_id
    );
    let priq = [...new Set(progress_report_id)];
    let cciq = [...new Set(concept_proposal_id)];

    let locations = [];
    // let concepts = [];
    // let innovations = [];
    for (let i = 0; i < cciq.length; i++) {
        const rows = await db.query(
            `SELECT * FROM concept_proposal
        INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
        WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
      `
        );
        const data = helper.emptyOrRows(rows);
        data.map((item) => {
            locations.push({
                concept_proposal_id: item.concept_proposal_id,
                concept_proposal_name: item.concept_proposal_name,
                concept_proposal_name_th: item.concept_proposal_name_th,
                project_type: item.project_type_id,
                lat: item.concept_proposal_latitude,
                lon: item.concept_proposal_longitude,
            });
            // concepts.push({});
        });

        // start here
        const newlocation = helper.groupBy(locations, "concept_proposal_id");
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

        // end here
    }

    const newlocation = helper.groupBy(locations, "concept_proposal_id");
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

    const goalPoint = async() => {
        if (paramsQuery.goal_id == 1) {
            return await helper.compareArrayToAdd(
                co_locations,
                bcg_array,
                "concept_proposal_id"
            );
        }
        if (paramsQuery.goal_id == 2) {
            return await helper.compareArrayToAdd(
                co_locations,
                sdgs_array,
                "concept_proposal_id"
            );
        }
        if (paramsQuery.goal_id == 3) {
            return await helper.compareArrayToAdd(
                co_locations,
                curve_array,
                "concept_proposal_id"
            );
        }
        if (paramsQuery.goal_id == 4) {
            return await helper.compareArrayToAdd(
                co_locations,
                cluster_array,
                "concept_proposal_id"
            );
        }
    };

    const results = await goalPoint();

    const groupCencept = helper.groupBy(results, "concept_proposal_id");

    groupCencept.map((v) => {
        if (v.data[0].bcg) {
            if (v.data[0].bcg.length >= 1) {
                const o = v.data.slice(1);
                console.log(o);
                o.map((item) => {
                    item.bcg = [];
                });
            }
        }

        if (v.data[0].sdgs) {
            if (v.data[0].sdgs.length >= 1) {
                const o = v.data.slice(1);
                console.log(o);
                o.map((item) => {
                    item.sdgs = [];
                });
            }
        }

        if (v.data[0].curve) {
            if (v.data[0].curve.length >= 1) {
                const o = v.data.slice(1);
                console.log(o);
                o.map((item) => {
                    item.curve = [];
                });
            }
        }

        if (v.data[0].cluster) {
            if (v.data[0].cluster.length >= 1) {
                const o = v.data.slice(1);
                console.log(o);
                o.map((item) => {
                    item.cluster = [];
                });
            }
        }
    });

    // console.log(groupCencept);

    const prepareNodes = [];
    groupCencept.map((listvalue, index) => {
        listvalue.data.map((item) => prepareNodes.push(item));
    });

    const parentNodes = [];
    prepareNodes.map((listvalue, index) =>
        parentNodes.push({
            id: index + 1,
            type: "parent",
            concept_proposal_id: listvalue.concept_proposal_id,
            concept_proposal_name: listvalue.concept_proposal_name,
            concept_proposal_name_th: listvalue.concept_proposal_name_th,
            lat: listvalue.lat,
            lon: listvalue.lon,
            project_type: listvalue.project_type,
            // knowledges: listvalue.knowledges,
            // innovations: listvalue.innovations,
            [paramsQuery.goal_id == 1 ?
                "bcg" :
                paramsQuery.goal_id == 2 ?
                "sdgs" :
                paramsQuery.goal_id == 3 ?
                "curve" :
                paramsQuery.goal_id == 4 ?
                "cluster" :
                ""
            ]: paramsQuery.goal_id == 1 ?
                listvalue.bcg : paramsQuery.goal_id == 2 ?
                listvalue.sdgs : paramsQuery.goal_id == 3 ?
                listvalue.curve : paramsQuery.goal_id == 4 ?
                listvalue.cluster : "",
            img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
                }`,
        })
    );

    // const childNodes = [];
    const childNodesConcepts = [];
    // const childNodesInnovations = [];
    const childNodeGoal = [];
    parentNodes.map((listvalue, i) => {
        // childNodesConcepts.push({
        //   id: `${listvalue.id}.${i + 1}`,
        //   type: "child",
        //   concept_proposal_id: listvalue.concept_proposal_id,
        //   concept_proposal_name_th: listvalue.concept_proposal_name_th,
        //   lat: listvalue.lat,
        //   lon: listvalue.lon,
        //   img: `https://researcher.kims-rmuti.com/icon/${
        //     listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
        //   }`,
        // });

        // listvalue.knowledges.map((item, index) => {
        //   childNodes.push({
        //     id: `${listvalue.id}.${index + 1}xn`,
        //     type: "child",
        //     knowledge_name: item.knowledge_name,
        //     knowledge_detail: item.knowledge_detail,
        //     lat: listvalue.lat,
        //     lon: listvalue.lon,
        //     img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/knowledge-icon.png",
        //   });
        // });

        // listvalue.innovations.map((item, index) => {
        //   childNodesInnovations.push({
        //     id: `${listvalue.id}.${index + 1}xx`,
        //     type: "child",
        //     output_name: item.output_name,
        //     output_detail: item.output_detail,
        //     lat: listvalue.lat,
        //     lon: listvalue.lon,
        //     img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon.png",
        //   });
        // });

        listvalue[
            `${paramsQuery.goal_id == 1
                ? "bcg"
                : paramsQuery.goal_id == 2
                    ? "sdgs"
                    : paramsQuery.goal_id == 3
                        ? "curve"
                        : paramsQuery.goal_id == 4
                            ? "cluster"
                            : ""
            }`
        ].map((item, index) => {
            childNodeGoal.push({
                id: `${listvalue.id}.${index + 1}`,
                concept_proposal_id: listvalue.concept_proposal_id,
                type: "child",
                [paramsQuery.goal_id == 1 ?
                    "bcg" :
                    paramsQuery.goal_id == 2 ?
                    "sdgs" :
                    paramsQuery.goal_id == 3 ?
                    "curve" :
                    paramsQuery.goal_id == 4 ?
                    "cluster" :
                    ""
                ]: paramsQuery.goal_id == 1 ?
                    item.bcg_name : paramsQuery.goal_id == 2 ?
                    item.sdgs_name : paramsQuery.goal_id == 3 ?
                    item.curve_name : paramsQuery.goal_id == 4 ?
                    item.cluster_name : "",
                lat: listvalue.lat,
                lon: listvalue.lon,
                img: `https://researcher.kims-rmuti.com/icon/${item.img}`,
            });
        });
    });

    console.log(childNodeGoal);

    // let linksknow = [];
    // let linkgoal = [];
    let linkconcept = [];

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

    console.log(linkNode);

    helper.applyArray(parentNodes, childNodeGoal);
    helper.applyArray(parentNodes, childNodesConcepts);

    const links = childNodeGoal.map((listvalue) => {
        return {
            from: listvalue.id | 0,
            to: listvalue.id,
        };
    });

    helper.applyArray(links, linkconcept);
    helper.applyArray(links, linkNode);

    return {
        nodes: parentNodes,
        links: links,
    };
}



module.exports = {

    getGoal,

};