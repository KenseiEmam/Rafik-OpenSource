export const testApi = process.env.RAFIK_TEST_API || 'http://127.0.0.1:55331'
export const testWeb = process.env.RAFIK_TEST_WEB || 'http://127.0.0.1:5173'
export const testPreview = process.env.RAFIK_TEST_PREVIEW || 'http://127.0.0.1:5174'
export const testDatabase = process.env.RAFIK_TEST_DATABASE || 'rafik'
export const testFiles = process.env.RAFIK_TEST_FILES || '.local/files'
if (
  ![testApi, testWeb, testPreview].every((x) =>
    /^http:\/\/127\.0\.0\.1:(55331|55341|5173|5174|5183|5184)$/.test(x),
  ) ||
  !/^(rafik|rafik_browser_\d+)$/.test(testDatabase) ||
  !/^\.local\/(files|browser-\d+)$/.test(testFiles)
)
  throw Error('Invalid local test configuration')
