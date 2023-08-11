const pkg = require('./package.json');

const pluginName = pkg.name.replace('eslint-plugin-', '');

const isClientGlobalName = (name) => {
  return ['shopify', 'window'].includes(name);
};

const isReturnValueJSXOrNull = (scope) => {
  if (
    scope.block &&
    scope.block.body &&
    scope.block.body.body &&
    typeof scope.block.body.body.find === 'function'
  ) {
    return (
      scope.type === 'function' &&
      scope.block.body.body.find(
        (e) =>
          e &&
          e.type === 'ReturnStatement' &&
          e.argument &&
          (e.argument.type === 'JSXElement' ||
            e.argument.type === 'JSXFragment' ||
            (e.argument.type === 'Literal' && e.argument.value === null)),
      )
    );
  }
  return false;
};

const isFirstLetterCapitalized = (name) => {
  return name && name[0] === name[0].toUpperCase();
};

const isRemixServerFunctionName = (name) => {
  return [
    'loader',
    'action',
    'headers',
    'links',
    'meta',
    'shouldRevalidate',
  ].includes(name);
};

const isReactFunctionComponent = (scope) => {
  switch (scope.block.type) {
    case 'FunctionDeclaration':
      return (
        isFirstLetterCapitalized(scope.block.id.name) &&
        isReturnValueJSXOrNull(scope)
      );
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      if (scope.block.parent.type === 'VariableDeclarator') {
        return (
          isFirstLetterCapitalized(scope.block.parent.id.name) &&
          isReturnValueJSXOrNull(scope)
        );
      }
  }
  return false;
};

const isRemixServerFunction = (scope) => {
  const isExportedRemixFunction = (node) => {
    while (node && node.parent) {
      if (node.type === 'Program') {
        return false;
      }

      switch (node.type) {
        case 'FunctionDeclaration':
          if (
            node.parent.type === 'ExportNamedDeclaration' &&
            isRemixServerFunctionName(node.id.name)
          ) {
            return true;
          }
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
          if (
            node.parent.type === 'VariableDeclarator' &&
            node.parent.parent?.parent?.type === 'ExportNamedDeclaration' &&
            isRemixServerFunctionName(node.parent.id.name)
          ) {
            return true;
          }
      }

      node = node.parent;
    }

    return false;
  };

  switch (scope.block.type) {
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return isExportedRemixFunction(scope.block);
  }
  return false;
};

const reportReference = (context, rule) => (reference) => {
  const node = reference.identifier;
  const {name, parent} = node;

  // Make sure that `typeof MYVAR` is always allowed and DOM related typescript type or interface are allowed
  if (
    (parent.type === 'UnaryExpression' && parent.operator === 'typeof') ||
    parent.type === 'TSTypeReference' ||
    parent.type === 'TSInterfaceHeritage'
  ) {
    return;
  }

  switch (rule) {
    case 'no-client-globals-in-module-scope':
      if (
        reference.from.type === 'module' ||
        reference.from.upper.type === 'global'
      ) {
        context.report({
          node,
          messageId: 'defaultMessage',
          data: {
            name,
          },
        });
      }
      return;

    case 'no-client-globals-in-react-fc':
      if (isReactFunctionComponent(reference.from)) {
        context.report({
          node,
          messageId: 'defaultMessage',
          data: {
            name,
          },
        });
      }
      return;

    case 'no-client-globals-in-remix-functions': {
      if (isRemixServerFunction(reference.from)) {
        context.report({
          node,
          messageId: 'defaultMessage',
          data: {
            name,
          },
        });
      }
      return;
    }

    default:
      // eslint-disable-next-line no-console
      console.error(`Unexpected rule-name: ${rule}`);
      break;
  }
};

const createFn = (rule) => (context) => {
  return {
    Program() {
      const filename = context.getFilename();
      if (/\.test\.(js|ts)x?$/.test(filename)) {
        return;
      }

      const scope = context.getScope();

      // Report variables declared elsewhere (ex: variables defined as "global" by eslint)
      scope.variables.forEach((variable) => {
        if (!variable.defs.length && isClientGlobalName(variable.name)) {
          variable.references.forEach(reportReference(context, rule));
        }
      });

      // Report variables not declared at all
      scope.through.forEach((reference) => {
        if (isClientGlobalName(reference.identifier.name)) {
          reportReference(context, rule)(reference);
        }
      });
    },
  };
};

const createRule = (name, description, defaultMessage) => {
  return {
    [name]: {
      meta: {
        type: 'problem',
        docs: {
          description,
          recommended: true,
        },
        messages: {
          defaultMessage,
        },
      },
      create: createFn(name),
    },
  };
};

const rules = {
  ...createRule(
    'no-client-globals-in-module-scope',
    'disallow use of client globals in module scope',
    "Use of client global '{{name}}' is forbidden in module scope",
  ),
  ...createRule(
    'no-client-globals-in-react-fc',
    'disallow use of client globals in the render-cycle of a React function compononent',
    "Use of client global '{{name}}' is forbidden in the render-cycle of a React function compononent, consider moving this inside useEffect()",
  ),
  ...createRule(
    'no-client-globals-in-remix-functions',
    'disallow use of client globals in Remix server functions',
    "Use of client global '{{name}}' is forbidden in Remix server functions",
  ),
};

module.exports = {
  configs: {
    recommended: {
      plugins: [pluginName],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: Object.keys(rules).reduce((carry, key) => {
        carry[`${pluginName}/${key}`] = 'error';
        return carry;
      }, {}),
    },
  },
  rules,
};
