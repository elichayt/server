// ?respond with "hello world" when a GET request is made to the homepage
const express = require('express');

const { auth, isAdmin } = require('../middleware/auth');
const { UserModel, userValidation, creatToken, loginValidation, delUserValidation, userUpdateValidation } = require('../models/userModel');
const router = express.Router();

// ?if somone made mistake and GET the login route
router.get('/login', (req, res) => {
  res.json({ msg: 'POST here for login !' })


})

// ? signin(register) new default user using POST 
router.post('/signIn', async (req, res) => {
  // * joi validation 
  let validateRequest = userValidation(req.body)
  if (validateRequest.error) {
    return res.status(400).json(validateRequest.error.details)
  }

  try {
    let data = UserModel(req.body);
    await data.save(); // saving at db
    res.status(201).json({ msg: `${data.userName} are added successfully!` })
  } catch (error) {

    // * if the erro is alredy in db (INDEX UNIQU) then notif the user !
    if (error.code === 11000) res.status(409).json({ problem: error.keyValue, msg: ` alredy exist!`, error: error });
    else res.status(500).json({ msg: error });
    console.log(error);

  }
})

//?  login user using mail/username as "account" value and password
router.post('/login', async (req, res) => {
  // * joi check
  let validateReq = loginValidation(req.body)
  if (validateReq.error) {
    return res.status(401).json(validateReq.error.details)
  }
  try {
    let data = req.body;

    // * check that : (userName OR email) AND (password) are existing in db 
    let search = await UserModel.findOne({ $and: [{ $or: [{ userName: data.account }, { email: data.account }] }, { password: data.password }] })

    // ? if not existing in db then throw back error
    if (!search) {
      return res.status(401).json({ msg: 'invalid credentials ' })
    }
    //  ? on valid creat new token for user allow him to navigate trogh the different section withou login in 
    let token = creatToken(search._id, search.role)
    //* throw back token to user
    res.status(200).json({ token: token })

  } catch (err) {
    console.log(err);
    res.status(400).json({ err: err });
  }
})


// * see your info with token 
router.get('/myInfo', auth, async (req, res) => {
  // res.json(req.tokenData.id);
  let data = await UserModel.findOne({ _id: req.tokenData.id })

  res.status(200).json({ msg: `sucessfuly logged in as ${data.userName}`, data: data });

})


// *______ADMIN SECTION______*


// ?allow you to del users by id passsed into "target" query
router.delete('/delUser', auth, isAdmin, async (req, res) => {

  try {

    let userToDel = req.query.target

    if (!userToDel) {
      return res.status(400).json({
        msg: 'query "target" is empty or invalid please provide target for deletion'
      })
    }
    let data = await UserModel.deleteOne({ _id: userToDel })
    // ? if deleted count is returned 0 than throw back an error 
    if (data.deletedCount == 0) {
      return res.status(400).json({ msg: `faild to delete ${userToDel} user not existing in DB ` })
    } else {
      res.status(200).json({ msg: `${userToDel} -> deleted successfully!`, data })
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: err });
  }
})


// * allow you to update user by passing id in "target" as query and parametter to update as JSON body :
// !check is needed 
router.patch('/updateUser', auth, isAdmin, async (req, res) => {
  // * joi validation :
  let validUpdate = userUpdateValidation(req.body)
  if (validUpdate.error) {
    return res.status(401).json(validUpdate.error.details)
  }
  try {
    let target = req.query.target
    let toUpdate = req.body

    if (!target) {
      return res.status(401).json({
        msg: 'query "target" is empty or invalid please provide target for update'
      })
    }
    if (Object.keys(toUpdate).length === 0) {
      return res.status(401).json({
        msg: 'request invalid body is empty provide change to perform on target'
      })
    }

    let data = await UserModel.updateOne({ _id: target }, { $set: toUpdate })

    // ? in case no matched document 
    if (!data.matchedCount) {
      return res.status(401).json({ msg: `${target} not existing in DB ` })
    }
    // ? in case no change beenn made 
    if (!data.modifiedCount) {
      return res.status(401).json({ msg: `${target} existing in DB , but no change have been made ! ` })
    }
    res.status(200).json({ msg: `${target} -> updated successfully!`, data })


  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
})

// ? allow you to browse all user and search them by their email or username 
// ? even a partial match is allowed do to the regex method used (I flag) 
router.get('/browse', auth, isAdmin, async (req, res) => {
  try {
    let maxPerPage = Number(req.query.perPage) || 4;
    let searchQuery = req.query.s
    let page = req.query.page
    let sort = req.query.sort || "_id";
    let reverse = req.query.reverse == "yes" ? 1 : -1;
    //? make it a regular expression for match even part of word or if its case sensitive.
    let regoulared = new RegExp(searchQuery, 'i')




    //    * finde using regex in db 
    let data = await UserModel

      .find({ $or: [{ userName: regoulared }, { email: regoulared }] })
      .limit(maxPerPage)
      .skip((page - 1) * maxPerPage)
      .sort({ [sort]: reverse })


    if (data.length == 0) {
     return res.status(404).json({ msg: `${searchQuery} is not existing at db ` })
    }
    res.status(200).json({ data: data })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
})


module.exports = router;
