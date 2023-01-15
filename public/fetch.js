const content= async()=>{
    console.log("hello")
    let raw= await fetch("/S3Images")
    let data = await raw.json()
    console.log(data.Contents)
    let loadingData=``
    data.Contents.forEach(element => {
        console.log(element)
        let d= `<img class="card" src="https://testbucketfp.s3.ap-south-1.amazonaws.com/${element.Key}" height="320px" width="320px">`
        loadingData+=d
    });
        return loadingData
}

const render = async() =>{
    let renderIt =""
    renderIt = await content()
    document.querySelector('.allCards').innerHTML+=renderIt
    

}
render()
