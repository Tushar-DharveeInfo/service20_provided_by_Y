
const ContainerStyle = {
    width: "100%",
    height: "100%",
};

const GridDefaults = {
    paginationPageSize: 10, //default page size
    rowHeight: 25,// default height of row
    rowSelection: 'single', // default row selection
    rowBuffer: 50,// default row buffer
    numberOfShowAtOnce: 5000
}

const Measurement = ["width", "length", "depth", "height", 'power']
const hideGridData = ['EntityName', 'LastUpdated', 'Secured', 'IsNZ']
export { ContainerStyle, GridDefaults, Measurement, hideGridData }
