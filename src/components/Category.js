// hooks
import { useContext, useEffect, useState } from "react"
import { useHistory, useParams } from "react-router-dom"
import { useList } from "react-firebase-hooks/database"
// antd
import { Result, Button } from "antd"
// constants
import { db } from "constant/firebase"
import { CATEGORIES, SPREADSHEET_KEY } from "constant/static"
// context
import { StateContext } from "context/StateContext"
// helper
import { toKebabCase, toTitleCase } from "utils/caseHelper"
import { verificationColumn } from "components/Verification"
// components
import Loader from "components/Loader"
import Verification from "components/Verification"
// styles
import Table from "components/Table"
// columns
import {
  COLUMNS_PER_CATEGORY,
  DEFAULT_COLUMNS,
  buildColumns,
} from "constant/columns"

const CategoryComponent = ({ category, stateContext }) => {
  const { selectedState } = stateContext

  // fetch all by default
  let dbRef = db.ref(`${SPREADSHEET_KEY}/${category}`)
  const isExternalResources = category === "external-resources"
  // if state is selected in the context (from the header)
  // filter based on state
  if (selectedState && !isExternalResources) {
    dbRef = db
      .ref(`${SPREADSHEET_KEY}/${category}`)
      .orderByChild("State")
      .equalTo(selectedState)
  }

  const [snapshots, loading, error] = useList(dbRef)
  const [dataSource, setDataSource] = useState([])
  useEffect(() => {
    setDataSource(snapshots.map((i) => i.val()))
  }, [snapshots])

  const preDefinedColumns = COLUMNS_PER_CATEGORY?.[category] ?? DEFAULT_COLUMNS
  // Update columns
  // -> Show state column if no state is selected
  const columns =
    !selectedState || isExternalResources
      ? buildColumns(preDefinedColumns)
      : buildColumns(preDefinedColumns).filter((x) => x.key !== "State")

  return (
    <Verification selectedState={selectedState} category={category}>
      {(verificationProps) => {
        const { downvoteFn, upvoteFn, verificationCounts } = verificationProps
        // add verification counts in dataSource
        const dataWithCounts = dataSource.map((i) => {
          let field = verificationCounts?.[i.key]
          // if no state is selected, the structure is {[State]: {[key] : {upvote, downvote}}}
          if (!selectedState) {
            field = verificationCounts?.[toKebabCase(i.State)]?.[i.key]
          }
          return {
            ...i,
            upvote: field?.upvote ?? 0,
            downvote: field?.downvote ?? 0,
            lastVoted: field?.lastVoted ?? null,
            lastVotedType: field?.lastVotedType ?? null,
          }
        })

        let updatedColumns = columns
        if (!isExternalResources) {
          updatedColumns = [
            ...columns,
            verificationColumn({
              upvote: upvoteFn,
              downvote: downvoteFn,
            }),
          ]
        }

        return (
          <Table
            columns={updatedColumns}
            dataSource={dataWithCounts}
            loading={loading}
            error={error}
            resetSearch={isExternalResources}
          />
        )
      }}
    </Verification>
  )
}

// Fetches data for the category and displays in the antd table
const Category = () => {
  const history = useHistory()
  let { category } = useParams()

  const stateContext = useContext(StateContext)
  const { loadingState } = stateContext

  if (!loadingState && !category) return null
  // Only fetch category from firebase if it is in the approved list of CATEGORIES
  if (!CATEGORIES.includes(toTitleCase(category))) {
    return (
      <Result
        status="404"
        title="404"
        subTitle={`Requested category ${category} not found`}
        extra={
          <Button onClick={() => history.push("/")} type="primary">
            Back Home
          </Button>
        }
      />
    )
  }
  if (loadingState) {
    // Loading when state being fetched from geolocation
    return <Loader />
  } else {
    return <CategoryComponent category={category} stateContext={stateContext} />
  }
}

export default Category
