"use strict";

const vscode = require('vscode')


const beginDisplayMath = ["$$", "\\[","\\("];
const endDisplayMath = ["$$", "\\]","\\)"];
const beginInlineMath = ["$", "\\("];
const endInlineMath = ["$", "\\)"];


function MatchIndex(matchStr, matchIndex) {
	this.matchStr = matchStr;
	this.matchIndex = matchIndex;
}

// find first match substring
function searchSubStr(strArr, str, lastMatch) {
	let count = 0;
	let match = new MatchIndex('', -1)
	while (count < strArr.length) {
		if (
			(match.matchIndex = (
				lastMatch
				? str.lastIndexOf(strArr[count])
				: str.indexOf(strArr[count])
				)
			) !== -1
		) {
			match.matchStr = strArr[count];
			break;
		}
		count++;
	}
	return match;
}

// goto end delimiter
function jumpToEndPosition(document, position, endMath) {
	const textLine = document.lineCount;  // get total line count
	let insertPosition = new vscode.Position;
	insertPosition = position;
	let line = position.line;

	let match = new MatchIndex;

	// current line
	let localRangeText = document.getText(new vscode.Range(position, document.lineAt(position).range.end));
	match = searchSubStr(endMath, localRangeText);

	if (match.matchIndex !== -1) {							// y: jump
		insertPosition = position.with(line, position.character + match.matchIndex + match.matchStr.length)
	}
	else {													// n: loop
		while (++line < textLine) {
			match = searchSubStr(endMath, document.lineAt(line).text);
			if (match.matchIndex !== -1) {
				insertPosition = position.with(line, match.matchIndex + match.matchStr.length);
				break
			}
		}
	}
	return {
		insertPosition,
		match
	};

}

// goto begin delimiter
function jumpToBeginPosition(document, position, beginMath) {
	let insertPosition = new vscode.Position;
	insertPosition = position;
	let line = position.line;

	let match = new MatchIndex;

	// current line
	let localRangeText = document.getText(new vscode.Range(position.with(position.line, 0), position));
	match = searchSubStr(beginMath, localRangeText, true);

	if (match.matchIndex !== -1) {							// y: jump
		insertPosition = position.with(line, match.matchIndex)
	}
	else {													// n: loop
		while (--line >= 0) {
			match = searchSubStr(beginMath, document.lineAt(line).text, true);
			if (match.matchIndex !== -1) {
				insertPosition = position.with(line, match.matchIndex);
				break
			}
		}
	}
	return {
		insertPosition,
		match
	};

}

function getMathRange(document, position, beginMath, endMath) {
	const beginInfo = jumpToBeginPosition(document, position, beginMath)
	const endInfo = jumpToEndPosition(document, position, endMath)
	const beginPosition = new vscode.Position(beginInfo.insertPosition.line, beginInfo.insertPosition.character + beginInfo.match.matchStr.length)
	const endPosition = new vscode.Position(endInfo.insertPosition.line, endInfo.match.matchIndex === -1 ? document.lineAt(endInfo.insertPosition).range.end.character : endInfo.insertPosition.character - endInfo.match.matchStr.length)
	return new vscode.Range(beginPosition, endPosition)
}



module.exports = {
	beginDisplayMath,
	endDisplayMath,
	beginInlineMath,
	endInlineMath,
	MatchIndex,
	searchSubStr,
	jumpToBeginPosition,
	jumpToEndPosition,
	getMathRange
}