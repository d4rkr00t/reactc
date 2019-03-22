let { types: t } = require("@babel/core");
let template = require("@babel/template").default;
let generator = require("@babel/generator").default;

/**
 * {
 *   className: "barchart__bar-title",
 *   style: {
 *     color: 'color',
 *     height: height
 *   },
 *   'data-name': 'name',
 *   onClick: () => {},
 *   value: 'bla'
 * }
 * ->
 * {
 *   $: {
 *     class: "barchart__bar-title",
 *     style: `color: color; height: ${toPx(height)}`
 *     'data-name': 'name'
 *   },
 *   $e: {
 *     click: () => {}
 *   },
 *   $a: {
 *     value: 'bla'
 *   }
 * }
 */
function processElementAttributes(normalizedAttrs) {
  if (!normalizedAttrs) {
    return;
  }

  if (
    normalizedAttrs.attributes.length ||
    normalizedAttrs.eventHandlers.length ||
    normalizedAttrs.properties.length
  ) {
    return t.objectExpression(
      [
        normalizedAttrs.attributes.length &&
          t.objectProperty(
            t.identifier("$"),
            t.objectExpression(normalizedAttrs.attributes)
          ),
        normalizedAttrs.eventHandlers.length &&
          t.objectProperty(
            t.identifier("$e"),
            t.objectExpression(normalizedAttrs.eventHandlers)
          ),
        normalizedAttrs.properties.length &&
          t.objectProperty(
            t.identifier("$p"),
            t.objectExpression(normalizedAttrs.properties)
          )
      ].filter(Boolean)
    );
  }
}

function processElementAttribute(elementType, attr, attrs) {
  let name = getAttrName(attr);
  let type = getAttrType(name);
  let processed =
    type === "eventHandlers"
      ? processEventHandler(elementType, name, attr, attrs)
      : type === "properties"
      ? processProperty(elementType, name, attr, attrs)
      : processAttribute(elementType, name, attr, attrs);

  return [type, processed];
}

function processEventHandler(elementType, attrName, attr, attrs) {
  let eventName = attrName.replace("on", "").toLowerCase();
  if (eventName === "doubleclick") {
    eventName = "dblclick";
  } else if (
    eventName === "change" &&
    elementType === "input" &&
    (!getAttrValue("type", attrs) || getAttrValue("type", attrs) === "text")
  ) {
    eventName = "input";
  }

  return setAttributeName(attr, eventName);
}

function processProperty(elementType, attrName, attr) {
  // noop for now
  return attr;
}

function processAttribute(elementType, attrName, attr) {
  let mapping = {
    acceptCharset: "accept-charset",
    className: "class",
    htmlFor: "for",
    httpEquiv: "http-equiv"
  };
  let name = mapping[attrName] || attrName;
  if (name === "style") {
    attr = processStyles(attr);
  }
  return setAttributeName(attr, name);
}

function setAttributeName(attr, name) {
  if (t.isStringLiteral(attr.key) || name.indexOf("-") > -1) {
    return t.objectProperty(t.stringLiteral(name), attr.value);
  }
  return t.objectProperty(t.identifier(name), attr.value);
}

// TODO: check value as an attribute
function isProperty(name) {
  return ["checked", "multiple", "muted", "selected", "value"].includes(name);
}

function getAttrName(attr) {
  return t.isStringLiteral(attr.key) ? attr.key.value : attr.key.name;
}

function getAttrType(name) {
  return name.startsWith("on")
    ? "eventHandlers"
    : name === "ref"
    ? "ref"
    : isProperty(name)
    ? "properties"
    : "attributes";
}

function shouldWrapInToPx(name) {
  return (
    [
      "height",
      "width",
      "left",
      "margin",
      "top",
      "right",
      "bottom",
      "left"
    ].indexOf(name) >= 0
  );
}

function getAttrValue(name, attrs) {
  let attr = attrs.properties.find(attr => getAttrName(attr) === name);
  return attr ? attr.value.value : undefined;
}

function getStyleAttrName(attr) {
  return getAttrName(attr).replace(/([A-Z])/g, $1 => "-" + $1.toLowerCase());
}

function processStyles(stylesAttr) {
  let str = stylesAttr.value.properties
    .map(attr => {
      let attrName = getStyleAttrName(attr);
      return {
        name: attrName,
        value:
          shouldWrapInToPx(attrName) && t.isNumericLiteral(attr.value)
            ? t.stringLiteral(attr.value.value + "px")
            : shouldWrapInToPx(attrName) &&
              !t.isStringLiteral(attr.value) &&
              !attrName.match(/^--/)
            ? t.callExpression(t.identifier("toPx"), [attr.value])
            : attr.value
      };
    })
    .reduce((acc, attr) => {
      if (t.isIdentifier(attr.value)) {
        acc.push(`${attr.name}:\${${attr.value.name}}`);
      } else if (
        (t.isStringLiteral(attr.value) && attr.value.value) ||
        t.isNumericLiteral(attr.value)
      ) {
        acc.push(`${attr.name}:${attr.value.value}`);
      } else if (
        t.isCallExpression(attr.value) ||
        t.isConditionalExpression(attr.value) ||
        t.isTemplateLiteral(attr.value)
      ) {
        acc.push(`${attr.name}:\${${generator(attr.value).code}}`);
      }
      return acc;
    }, [])
    .join(";");

  return t.objectProperty(
    stylesAttr.key,
    template.ast("`" + str + "`").expression
  );
}

function normalizeAttrs(elementType, attrs) {
  if (t.isNullLiteral(attrs)) {
    return;
  }

  return attrs.properties
    .map(p => t.cloneNode(p))
    .reduce(
      (acc, attr) => {
        let [type, processed] = processElementAttribute(
          elementType,
          attr,
          attrs
        );
        acc[type].push(processed);
        return acc;
      },
      {
        attributes: [],
        properties: [],
        eventHandlers: [],
        ref: []
      }
    );
}

module.exports = {
  processElementAttributes,
  processElementAttribute,
  normalizeAttrs
};
