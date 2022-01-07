const { loadFilesSync } = require("@graphql-tools/load-files");
const { mergeTypeDefs } = require("@graphql-tools/merge");
const { print } = require("graphql");
const fs = require("fs");

const targetParamName = process.argv[2];
if (!targetParamName) throw new Error("Missing target parameter");

/**
 * merge schema
 */
const lf = loadFilesSync(`${__dirname}/schema/**/*.graphql`);
const defsDN = mergeTypeDefs(lf);
const defs = print(defsDN);

const l = defs.split("\n}");

/**
 *
 * find query names include target
 *
 */
const queryRows = l
	.map((it) => it.match(/type\sQuery\s\{/))
	.filter(Boolean)[0]
	.input.split("\n");

const foundQueryNames = queryRows
	.filter((it) => it.includes(targetParamName))
	.map((it) => it.match(/\s(.+)\(.*/)[1]);

/**
 *
 * find mutation names include target
 *
 */
/** find input names */
const reg = new RegExp(`input\\s.+\\{(\\n.+)+${targetParamName}`);
const inputNames = l
	.map((it) =>
		it.match(reg)
			? it.match(reg)[0].match(/(input)\s(.+)\s\{/)[2]
			: null
	)
	.filter(Boolean);

/** find mutation names*/
const mutationRows = l
	.map((it) => it.match(/type\sMutation\s\{/))
	.filter(Boolean)[0]
	.input.split("\n");

const foundMutationNames = mutationRows
	.filter((it) => inputNames.some((_it) => it.match(_it)))
	.map((it) => it.match(/\s(.+)\(.*/)[1]);

/**
 * export as text file
 */
const text = `#\x20${targetParamName}がinputに含まれるquery
${foundQueryNames.map((it) => "-\x20" + it).join("\n")}

#\x20${targetParamName}がinputに含まれるmutation
${foundMutationNames.map((it) => "-\x20" + it).join("\n")}`;

fs.writeFileSync(`${__dirname}/query-names.md`, text, () => {
	console.log("done");
});

console.info(text);
